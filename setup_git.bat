@echo off
set GIT="C:\Program Files\Git\cmd\git.exe"
%GIT% config --global user.name "auhsuai"
%GIT% config --global user.email "auhsuai@users.noreply.github.com"
%GIT% init
%GIT% add .
%GIT% commit -m "Initial commit: Auto LaTeX Add-in"
%GIT% branch -M main
%GIT% remote add origin https://github.com/auhsuai/auto-latex.git
