"""Install required Python dependencies for Digital Raitha."""

import subprocess
import sys


REQUIRED_PACKAGES = [
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


def install_package(package_name):
    """Install a Python package using pip."""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])
        print(f"[SUCCESS] Installed {package_name}")
        return True
    except subprocess.CalledProcessError as error:
        print(f"[ERROR] Failed to install {package_name}: {error}")
        return False


def check_package(display_name, import_name):
    """Check if a Python package can be imported."""
    try:
        __import__(import_name)
        print(f"[INSTALLED] {display_name}")
        return True
    except ImportError:
        print(f"[MISSING] {display_name}")
        return False


def main():
    """Main function to install dependencies."""
    print("Digital Raitha Dependency Installer")
    print("=" * 40)

    print("Checking installed packages...")
    missing_packages = []
    for package_name, import_name in REQUIRED_PACKAGES:
        if not check_package(package_name, import_name):
            missing_packages.append(package_name)

    if missing_packages:
        print(f"\nInstalling {len(missing_packages)} missing packages...")
        print("-" * 40)
        for package_name in missing_packages:
            install_package(package_name)
        print("\n[COMPLETE] Dependency installation finished.")
    else:
        print("\n[SUCCESS] All required packages are already installed.")

    print("\nNext steps:")
    print("1. Place your dataset CSV files in the 'data/' directory")
    print("2. Run 'python data/test_dataset_processing.py' to verify datasets")
    print("3. Run 'npm run model:train' to train AI models")


if __name__ == "__main__":
    main()
