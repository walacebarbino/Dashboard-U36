from app import create_app

print(">>> entrando no app.py")
app = create_app()
print(">>> app criada com sucesso")

if __name__ == "__main__":
    print(">>> subindo servidor Flask")
    app.run(debug=True, host="0.0.0.0", port=5000)