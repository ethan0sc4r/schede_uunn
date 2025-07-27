@echo off
echo Testing Naval Units API...
echo.
echo Testing health endpoint...
curl -X GET "http://127.0.0.1:8000/health" -H "accept: application/json"
echo.
echo.
echo Testing API docs availability...
curl -I "http://127.0.0.1:8000/docs"
echo.
echo.
echo If you see responses above, the API is working!
pause