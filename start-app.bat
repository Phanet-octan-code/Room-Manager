@echo off
title ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល (Rental Room Management)
echo ===================================================
echo   កំពុងបើកដំណើរការ ប្រព័ន្ធគ្រប់គ្រងបន្ទប់ជួល...
echo   Starting Rental Room Management System...
echo ===================================================
start "" "http://localhost:5173"
node server.js
pause
