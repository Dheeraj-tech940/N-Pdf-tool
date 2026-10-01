from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from compress import compress_pdf

import os
import uuid

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


@app.get("/")
def home():
    return {"message": "PDFTool backend is running"}


@app.post("/compress")
async def compress(file: UploadFile = File(...)):
    input_name = f"{uuid.uuid4()}.pdf"
    output_name = f"compressed-{uuid.uuid4()}.pdf"

    input_path = os.path.join(UPLOAD_DIR, input_name)
    output_path = os.path.join(OUTPUT_DIR, output_name)

    with open(input_path, "wb") as buffer:
        buffer.write(await file.read())

    compress_pdf(input_path, output_path)

    return FileResponse(
        output_path,
        media_type="application/pdf",
        filename="compressed.pdf",
    )