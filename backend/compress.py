import subprocess

GS_PATH = "gs"


def compress_pdf(input_file: str, output_file: str):
    subprocess.run(
        [
            GS_PATH,
            "-sDEVICE=pdfwrite",
            "-dCompatibilityLevel=1.4",
            "-dPDFSETTINGS=/ebook",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            f"-sOutputFile={output_file}",
            input_file,
        ],
        check=True,
    )