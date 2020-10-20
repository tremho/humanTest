
npm install -g electron-packager

# make Mac
electron-packager . --overwrite --platform=darwin --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist --icon=assets/icons/mac/icon.icns --prune=true --out=release-builds

# make Windows
electron-packager . HumanTest --overwrite --asar --platform=win32 --arch=ia32  --extraResource=../index.html --extraResource=../css --extraResource=../dist  --icon=assets/icons/win/icon.ico --prune=true --out=release-builds --version-string.CompanyName=CE --version-string.FileDescription=CE --version-string.ProductName="HumanTest"

# make Linux
electron-packager . HumanTest --overwrite --asar --platform=linux --arch=x64 --extraResource=../index.html --extraResource=../css --extraResource=../dist   --icon=assets/icons/png/1024x1024.png --prune=true --out=release-builds
