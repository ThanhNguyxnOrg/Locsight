cmake_minimum_required(VERSION 3.20)
project(CodebaseAnalyzer
        VERSION 1.0.0
        DESCRIPTION "Local codebase scanner & LOC analyzer"
        LANGUAGES CXX)

include(GNUInstallDirs)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

if(MSVC)
    add_compile_options(/W4 /utf-8 /permissive-)
else()
    add_compile_options(-Wall -Wextra -Wpedantic)
endif()

# Force UTF-8 console output on Windows so Vietnamese diacritics render properly
if(WIN32)
    add_compile_definitions(_CRT_SECURE_NO_WARNINGS)
endif()

set(SOURCES
    src/main.cpp
    src/FileAnalyzer.cpp
    src/CppAnalyzer.cpp
    src/CAnalyzer.cpp
    src/PythonAnalyzer.cpp
    src/HtmlAnalyzer.cpp
    src/CssAnalyzer.cpp
    src/JavaScriptAnalyzer.cpp
    src/TypeScriptAnalyzer.cpp
    src/JavaAnalyzer.cpp
    src/CSharpAnalyzer.cpp
    src/DirectoryScanner.cpp
    src/ReportGenerator.cpp
)

add_executable(codebase_analyzer ${SOURCES})
target_include_directories(codebase_analyzer PRIVATE include)

if(MSVC)
    set_property(TARGET codebase_analyzer PROPERTY
        MSVC_RUNTIME_LIBRARY "MultiThreaded$<$<CONFIG:Debug>:Debug>")
endif()

install(TARGETS codebase_analyzer
        RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})

# ==========================================
# 🧪 Automated Testing Configuration
# ==========================================
enable_testing()

add_executable(unit_tests 
    tests/unit_tests.cpp
    src/FileAnalyzer.cpp
)
target_include_directories(unit_tests PRIVATE include)

add_test(NAME CoreUnitTests COMMAND unit_tests)

