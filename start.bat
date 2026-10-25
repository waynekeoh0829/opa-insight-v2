@echo off
echo Starting OPA Insight v2...

start "OPA Backend" cmd /k "cd backend && pip install -r requirements.txt && python app.py"
timeout /t 3 > nul
start "OPA Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo Default login: admin@opa.com / admin123
