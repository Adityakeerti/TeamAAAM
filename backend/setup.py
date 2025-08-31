#!/usr/bin/env python3
"""
Cargo Laytime Backend Package

A comprehensive maritime document processing system that extracts data from 
Statement of Facts (SOF) documents and calculates laytime utilization.
"""

import os
from setuptools import setup, find_packages

# Read the README file for long description
def read_readme():
    readme_path = os.path.join(os.path.dirname(__file__), '..', 'README.md')
    if os.path.exists(readme_path):
        with open(readme_path, 'r', encoding='utf-8') as f:
            return f.read()
    return "Cargo Laytime - Maritime Document Processing System"

# Read requirements from requirements.txt
def read_requirements():
    requirements_path = os.path.join(os.path.dirname(__file__), 'requirements.txt')
    if os.path.exists(requirements_path):
        with open(requirements_path, 'r', encoding='utf-8') as f:
            return [line.strip() for line in f if line.strip() and not line.startswith('#')]
    return []

# Package configuration
setup(
    name="cargo-laytime-backend",
    version="1.0.0",
    author="Cargo Laytime Team",
    author_email="team@cargolaytime.com",
    description="Maritime document processing and laytime calculation system",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/your-org/cargo-laytime",
    project_urls={
        "Bug Tracker": "https://github.com/your-org/cargo-laytime/issues",
        "Documentation": "https://github.com/your-org/cargo-laytime#readme",
        "Source Code": "https://github.com/your-org/cargo-laytime",
    },
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Maritime Industry",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Office/Business :: Financial :: Accounting",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Text Processing :: Markup :: HTML",
        "Topic :: Utilities",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "black>=23.11.0",
            "flake8>=6.1.0",
            "mypy>=1.7.0",
            "pre-commit>=3.5.0",
        ],
        "test": [
            "pytest>=7.4.3",
            "pytest-asyncio>=0.21.1",
            "pytest-cov>=4.1.0",
            "httpx>=0.25.0",
        ],
        "docs": [
            "mkdocs>=1.5.0",
            "mkdocs-material>=9.4.0",
            "mkdocstrings[python]>=0.23.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "cargo-laytime=main:main",
            "cargo-laytime-server=main:run_server",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.json", "*.yaml", "*.yml", "*.txt", "*.md"],
    },
    keywords=[
        "maritime",
        "laytime",
        "demurrage",
        "dispatch",
        "SOF",
        "Statement of Facts",
        "PDF processing",
        "OCR",
        "AI",
        "document processing",
        "vessel",
        "cargo",
        "port operations",
        "shipping",
        "logistics",
    ],
    license="MIT",
    platforms=["any"],
    zip_safe=False,
    # Additional metadata
    maintainer="Cargo Laytime Development Team",
    maintainer_email="dev@cargolaytime.com",
    download_url="https://github.com/your-org/cargo-laytime/archive/v1.0.0.tar.gz",
    provides=["cargo_laytime_backend"],
    requires_python=">=3.8",
    # Development dependencies
    setup_requires=[
        "setuptools>=45.0.0",
        "wheel>=0.37.0",
    ],
    # Package discovery
    package_dir={"": "."},
    py_modules=["main", "OCR_Script", "parser_script"],
    # Data files
    data_files=[
        ("config", ["goog_cred.json.example"]),
        ("deployment", ["render.yaml", "procfile"]),
    ],
)
