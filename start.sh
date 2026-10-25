#!/bin/bash
echo "Starting OPA Insight v2..."
cd backend && pip install -r requirements.txt && python app.py &
BACK_PID=$!
cd ../frontend && npm install && npm run dev &
FRONT_PID=$!
echo "Backend PID: $BACK_PID | Frontend PID: $FRONT_PID"
echo "Frontend: http://localhost:5173 | Backend: http://localhost:5000"
wait
