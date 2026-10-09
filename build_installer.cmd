@echo off
set LIB=C:\Users\Shalim\win_sdk\Windows Kits\10\Lib\10.0.22621.0\um\x64;C:\Users\Shalim\win_sdk\Windows Kits\10\Lib\10.0.22621.0\ucrt\x64;C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231\lib\x64;%LIB%
set INCLUDE=C:\Users\Shalim\win_sdk\Windows Kits\10\Include\10.0.22621.0\um;C:\Users\Shalim\win_sdk\Windows Kits\10\Include\10.0.22621.0\shared;C:\Users\Shalim\win_sdk\Windows Kits\10\Include\10.0.22621.0\ucrt;C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231\include;%INCLUDE%
set PATH=C:\Users\Shalim\.cargo\bin;C:\Users\Shalim\win_sdk\Windows Kits\10\bin\10.0.22621.0\x64;C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.51.36231\bin\Hostx64\x64;%PATH%
set RUSTFLAGS=-C linker=link.exe
call npm.cmd run tauri build -- --ignore-version-mismatches

