@echo off
title Subir planilha PPU
cd /d "%~dp0"
cd ..

if not exist "data\INSPECAO-RIR-PPU.xlsx" (
    echo ERRO: arquivo nao encontrado.
    pause
    exit /b 1
)

git add "data\INSPECAO-RIR-PPU.xlsx"
git diff --cached --quiet
if %errorlevel%==0 (
    echo Nenhuma alteracao detectada na planilha.
    pause
    exit /b 0
)

git commit -m "atualiza planilha PPU"
git push origin main

pause