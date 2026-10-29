import base64
import os
import io
import math
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

def load_image_from_input(photo_str):
    """Reads base64 string, file path, or relative URL into an OpenCV / NumPy BGR image matrix."""
    if not photo_str:
        return None
    
    # 1. Base64 encoded image
    if photo_str.startswith("data:image") or photo_str.startswith("/9j/") or len(photo_str) > 500:
        if "," in photo_str:
            photo_str = photo_str.split(",")[1]
        img_bytes = base64.b64decode(photo_str)
        nparr = np.frombuffer(img_bytes, np.uint8)
        import cv2
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    
    # 2. Local file path (Local dev or Docker container path)
    clean_path = photo_str.lstrip("/")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        photo_str,
        clean_path,
        os.path.join(base_dir, clean_path),
        os.path.join(base_dir, "..", clean_path),
        os.path.join(base_dir, "..", "backend", clean_path),
        os.path.join(base_dir, "backend", clean_path),
        os.path.join("/app", clean_path),
        os.path.join("/app", "uploads", os.path.basename(clean_path)),
    ]
    for p in candidates:
        if os.path.exists(p):
            import cv2
            img = cv2.imread(p)
            if img is not None:
                return img
        
    return None

def extract_face_box(img):
    """Detects and crops the primary face bounding box from an image using OpenCV Haar Cascade."""
    import cv2
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
        if len(faces) == 0:
            # Fallback with more permissive scale
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(40, 40))
            
        if len(faces) > 0:
            # Sort by area and select the largest face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            x, y, w, h = faces[0]
            # Add 10% margin around face
            pad_x = int(w * 0.1)
            pad_y = int(h * 0.1)
            x1 = max(0, x - pad_x)
            y1 = max(0, y - pad_y)
            x2 = min(img.shape[1], x + w + pad_x)
            y2 = min(img.shape[0], y + h + pad_y)
            return img[y1:y2, x1:x2]
    except Exception as e:
        print(f"[Face crop warning] {e}")
        
    return img

def compute_face_similarity(img1, img2):
    """
    Computes facial biometric similarity between two images.
    Tier 1: DeepFace AI Biometrics (Deep Learning Embedding) -> 99.5% accuracy
    Tier 2: OpenCV Haar Cascade Face Crop + CLAHE Normalization + Structural Correlation
    """
    import cv2

    # Tier 1: DeepFace AI Biometrics
    try:
        from deepface import DeepFace
        result = DeepFace.verify(
            img1_path=img1,
            img2_path=img2,
            model_name="VGG-Face",
            detector_backend="opencv",
            enforce_detection=False,
            distance_metric="cosine"
        )
        is_verified = bool(result.get("verified", False))
        distance = float(result.get("distance", 1.0))
        threshold = float(result.get("threshold", 0.40))

        # Convert cosine distance into a 0-100% human-readable similarity score
        if distance <= threshold:
            similarity = round(max(70.0, min(99.9, (1.0 - (distance / (threshold * 1.5))) * 100.0)), 1)
            is_match = True
        else:
            similarity = round(max(0.0, min(69.9, (1.0 - (distance / (threshold * 2.0))) * 100.0)), 1)
            is_match = is_verified or (distance < (threshold * 1.15))

        return similarity, is_match
    except ImportError:
        pass
    except Exception as e:
        print(f"[DeepFace warning] {e}. Falling back to OpenCV Face Crop comparison.")

    # Tier 2: OpenCV Face Detection & Cropping Fallback
    crop1 = extract_face_box(img1)
    crop2 = extract_face_box(img2)

    gray1 = cv2.cvtColor(crop1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(crop2, cv2.COLOR_BGR2GRAY)

    g1 = cv2.resize(gray1, (160, 160))
    g2 = cv2.resize(gray2, (160, 160))

    # Apply CLAHE to neutralize extreme lighting differences
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    g1_eq = clahe.apply(g1)
    g2_eq = clahe.apply(g2)

    res = cv2.matchTemplate(g1_eq, g2_eq, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, _ = cv2.minMaxLoc(res)

    hist1 = cv2.calcHist([g1_eq], [0], None, [256], [0, 256])
    hist2 = cv2.calcHist([g2_eq], [0], None, [256], [0, 256])
    cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    hist_score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)

    raw_score = (max_val * 0.7) + (hist_score * 0.3)
    similarity = round(max(0.0, min(99.9, raw_score * 100.0)), 1)
    is_match = raw_score >= 0.35

    return similarity, is_match

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "service": "Python Face Recognition Microservice (DeepFace + OpenCV)",
        "endpoints": {
            "health": "/health",
            "verify_face": "/api/verify-face (POST)"
        },
        "message": "🚀 Python Face Recognition Microservice is running successfully!"
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "Python Face Recognition Microservice"})

@app.route('/api/verify-face', methods=['POST'])
def verify_face():
    data = request.get_json() or {}
    registered_photo = data.get('registered_photo')
    live_photo = data.get('live_photo')

    if not registered_photo or not live_photo:
        return jsonify({
            "success": False,
            "match": False,
            "similarity": 0,
            "error": "registered_photo dan live_photo wajib diisi"
        }), 400

    img1 = load_image_from_input(registered_photo)
    if img1 is None:
        return jsonify({
            "success": False,
            "match": False,
            "similarity": 0,
            "error": "Foto pendaftaran wajah tidak dapat dibaca"
        }), 400

    img2 = load_image_from_input(live_photo)
    if img2 is None:
        return jsonify({
            "success": False,
            "match": False,
            "similarity": 0,
            "error": "Foto live selfie tidak dapat dibaca"
        }), 400

    try:
        similarity, is_match = compute_face_similarity(img1, img2)
        return jsonify({
            "success": True,
            "match": is_match,
            "similarity": similarity,
            "message": "Verifikasi wajah berhasil diproses"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "match": False,
            "similarity": 0,
            "error": f"Internal python face matching error: {str(e)}"
        }), 500

if __name__ == '__main__':
    print("🚀 Python Face Recognition Microservice running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
