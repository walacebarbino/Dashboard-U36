@echo off
setlocal EnableExtensions

cd /d "C:\Users\walace.barbino\OneDrive - Andrade Gutierrez\Área de Trabalho\inspeção RIR PPU\data"

echo.
echo ==============================================
echo        LIBERADO PARA FABRICAR
echo ==============================================
echo.
echo Escolha a prioridade da programacao:
echo.
echo 0 - Rodar como atualmente
echo 1 - Prioridade por diametro
echo 2 - Prioridade por SOP
echo 3 - Prioridade por sequencia de montagem
echo 4 - Prioridade por diametro + SOP
echo 5 - Prioridade por diametro + sequencia de montagem
echo 6 - Prioridade por SOP + sequencia de montagem
echo 7 - Prioridade por diametro + SOP + sequencia de montagem
echo.

set /p MODO="Digite uma opcao de 0 a 7: "

if "%MODO%"=="0" goto executar
if "%MODO%"=="1" goto executar
if "%MODO%"=="2" goto executar
if "%MODO%"=="3" goto executar
if "%MODO%"=="4" goto executar
if "%MODO%"=="5" goto executar
if "%MODO%"=="6" goto executar
if "%MODO%"=="7" goto executar

echo.
echo Opcao invalida. Digite somente um numero de 0 a 7.
echo.
pause
exit /b

:executar
echo.
echo Executando programacao no modo %MODO%...
echo.

py ".\Liberado-fabricar.py" %MODO%

echo.
if errorlevel 1 (
    echo ==============================================
    echo PROCESSO FINALIZADO COM ERRO.
    echo Leia a mensagem exibida acima.
    echo ==============================================
) else (
    echo ==============================================
    echo PROCESSO CONCLUIDO COM SUCESSO.
    echo Arquivo gerado: consolidado_match.xlsx
    echo ==============================================
)

echo.
pause