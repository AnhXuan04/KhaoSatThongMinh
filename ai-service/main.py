from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI Backend!"}

@app.get("/api/test")
def test_api():
    return {"status": "success", "data": "Backend đã kết nối thành công!"}