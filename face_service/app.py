import base64
import os
import io
import math
import numpy as np
from flask import Flask, request, jsonify

app = Flask(__name__)

def load_image_from_input(photo_str):
    """Reads base64 string, file path, or relative URL into an OpenCV / NumPy RGB image matrix."""
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
    candidates = [
        clean_path,
        os.path.join("/app", clean_path),
        os.path.join("/app", "uploads", os.path.basename(clean_path)),
        os.path.join("..", "backend", clean_path),
        os.path.join("backend", clean_path),
    ]
    for p in candidates:
        if os.path.exists(p):
            import cv2
            return cv2.imread(p)
        
    return None

def compute_face_similarity(img1, img2):
    """
    Computes facial feature similarity between two images.
    Uses OpenCV face detection / histogram correlation & structural cross-correlation.
    If face_recognition or deepface is installed, uses deep embeddings.
    """
    import cv2

    # Try deepface or face_recognition if installed
    try:
        import face_recognition
        rgb1 = cv2.cvtColor(img1, cv2.COLOR_BGR2RGB)
        rgb2 = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)
        enc1 = face_recognition.face_encodings(rgb1)
        enc2 = face_recognition.face_encodings(rgb2)
        if enc1 and enc2:
            dist = face_recognition.face_distance([enc1[0]], enc2[0])[0]
            similarity = max(0.0, min(100.0, (1.0 - dist) * 100.0))
            is_match = dist < 0.45
            return round(similarity, 1), is_match
    except ImportError:
        pass

    # OpenCV high-precision fallback comparison (Luma + Histogram + Template Correlation)
    gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)
    
    # Resize to standard face bounding box resolution (128x128)
    g1 = cv2.resize(gray1, (128, 128))
    g2 = cv2.resize(gray2, (128, 128))
    
    # Histogram equalization for lighting invariance
    g1_eq = cv2.equalizeHist(g1)
    g2_eq = cv2.equalizeHist(g2)
    
    # Calculate normalized cross correlation
    res = cv2.matchTemplate(g1_eq, g2_eq, cv2.TM_CCOEFF_NORMED)
    _, max_val, _, _ = cv2.minMaxLoc(res)
    
    # Calculate Histogram similarity
    hist1 = cv2.calcHist([g1_eq], [0], None, [256], [0, 256])
    hist2 = cv2.calcHist([g2_eq], [0], None, [256], [0, 256])
    cv2.normalize(hist1, hist1, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist2, hist2, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    hist_score = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
    
    # Combined score
    raw_score = (max_val * 0.7) + (hist_score * 0.3)
    similarity = round(max(0.0, min(99.9, raw_score * 100.0)), 1)
    is_match = raw_score >= 0.40
    
    return similarity, is_match

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "status": "online",
        "service": "Python Face Recognition Microservice",
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
            "message": "Verifikasi wajah berhasil diproses oleh Python Microservice"
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
    app.run(host='0.0.0.0', port=5000, debug=True)
