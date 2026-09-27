@echo off
echo ===================================================
echo   Starting Python Face Recognition Microservice
echo   Endpoint: http://localhost:5000/api/verify-face
echo ===================================================

where py >nul 2>nul
if %errorlevel% equ 0 (
    py -m pip install -r requirements.txt
    py app.py
    goto end
)

where python >nul 2>nul
if %errorlevel% equ 0 (
    python -m pip install -r requirements.txt
    python app.py
    goto end
)

echo [ERROR] Python tidak ditemukan di sistem. Harap install Python 3.9+ terlebih dahulu.
pause

:end
