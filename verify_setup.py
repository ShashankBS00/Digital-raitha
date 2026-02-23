"""
Verification script to check that Digital Raitha is properly set up with your datasets.
"""

import subprocess
import sys
from pathlib import Path

REQUIRED_PYTHON_PACKAGES = [
    ("pandas", "pandas"),
    ("numpy", "numpy"),
    ("scikit-learn", "sklearn"),
    ("xgboost", "xgboost"),
    ("flask", "flask"),
    ("flask-cors", "flask_cors"),
    ("requests", "requests"),
    ("joblib", "joblib"),
    ("firebase-admin", "firebase_admin"),
    ("schedule", "schedule"),
]


def _safe_console_text(value):
    """Convert text to a console-safe representation for current stdout encoding."""
    encoding = sys.stdout.encoding or "utf-8"
    return str(value).encode(encoding, errors="replace").decode(encoding, errors="replace")


def check_file_structure():
    """Check that all required files and directories exist"""
    print("Checking file structure...")
    print("=" * 40)

    required_paths = [
        "data/",
        "data/Year-wise Damage Caused Due To Floods, Cyclonic Storm, Landslides etc.csv",
        "data/1. NASA POWER Data (Rainfall, Temperature, Humidity, Radiation)*.csv",
        "data/All India level Average Yield of Principal Crops from 2001-02 to 2015-16.csv",
        "data/All India level Area Under Principal Crops from 2001-02 to 2015-16.csv",
        "data/Production of principle crops.csv",
        "data/price.csv",
        "models/",
        "models/training/",
        "models/preprocessing/",
        "models/api/",
        "src/",
        "src/utils/datasetHelper.js",
    ]

    all_good = True
    project_root = Path(__file__).parent

    for path in required_paths:
        if "*" in path:
            matches = list(project_root.glob(path))
            exists = len(matches) > 0
        else:
            exists = (project_root / path).exists()

        if exists:
            print(f"[OK] Found: {path}")
        else:
            print(f"[MISSING] {path}")
            all_good = False

    return all_good


def check_python_dependencies():
    """Check that required Python packages are installed"""
    print("\nChecking Python dependencies...")
    print("=" * 40)

    all_good = True

    for package_name, import_name in REQUIRED_PYTHON_PACKAGES:
        try:
            __import__(import_name)
            print(f"[OK] {package_name} is installed")
        except ImportError:
            print(f"[MISSING] {package_name} is not installed")
            all_good = False

    if not all_good:
        print("\nInstall missing packages with:")
        print(
            "pip install pandas numpy scikit-learn xgboost flask "
            "flask-cors requests joblib firebase-admin schedule"
        )

    return all_good


def check_node_dependencies():
    """Check that required Node packages are installed"""
    print("\nChecking Node dependencies...")
    print("=" * 40)

    try:
        node_modules_path = Path(__file__).parent / "node_modules"
        if node_modules_path.exists():
            print("[OK] Node dependencies are installed")
            return True

        print("[MISSING] Node dependencies are not installed")
        print("Install them with: npm install")
        return False
    except Exception as error:
        print(f"[ERROR] Error checking Node dependencies: {error}")
        return False


def test_dataset_processing():
    """Test that dataset processing works"""
    print("\nTesting dataset processing...")
    print("=" * 40)

    try:
        result = subprocess.run(
            [sys.executable, "data/test_dataset_processing.py"],
            cwd=Path(__file__).parent,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=30,
        )

        if result.returncode == 0:
            print("[OK] Dataset processing test passed")
            print("Sample output:")
            lines = (result.stdout or "").split("\n")
            for line in lines[:10]:
                if line.strip():
                    print(f"  {_safe_console_text(line)}")
            return True

        print("[FAILED] Dataset processing test failed")
        print("Error output:")
        print(result.stderr or "")
        return False
    except subprocess.TimeoutExpired:
        print("[FAILED] Dataset processing test timed out")
        return False
    except Exception as error:
        print(f"[ERROR] Error running dataset processing test: {error}")
        return False


def show_next_steps():
    """Show recommended next steps"""
    print("\n" + "=" * 50)
    print("NEXT STEPS")
    print("=" * 50)
    print("1. Process your datasets:")
    print("   npm run model:process-data")
    print()
    print("2. Train AI models with your data:")
    print("   npm run model:train")
    print()
    print("3. Start the web application:")
    print("   npm run dev")
    print()
    print("4. Access the application at http://localhost:5173")


def main():
    """Main verification function"""
    print("Digital Raitha Setup Verification")
    print("=" * 50)

    file_structure_ok = check_file_structure()
    python_deps_ok = check_python_dependencies()
    node_deps_ok = check_node_dependencies()
    dataset_processing_ok = test_dataset_processing()

    print("\n" + "=" * 50)
    print("VERIFICATION SUMMARY")
    print("=" * 50)
    print(f"File structure: {'[OK]' if file_structure_ok else '[ISSUES FOUND]'}")
    print(f"Python dependencies: {'[OK]' if python_deps_ok else '[ISSUES FOUND]'}")
    print(f"Node dependencies: {'[OK]' if node_deps_ok else '[ISSUES FOUND]'}")
    print(f"Dataset processing: {'[OK]' if dataset_processing_ok else '[ISSUES FOUND]'}")

    all_checks_passed = (
        file_structure_ok and python_deps_ok and node_deps_ok and dataset_processing_ok
    )

    if all_checks_passed:
        print("\nAll checks passed. Your Digital Raitha setup is ready.")
        show_next_steps()
    else:
        print("\nSome checks failed. Please address the issues above.")
        print("Refer to the documentation for detailed setup instructions.")


if __name__ == "__main__":
    main()
