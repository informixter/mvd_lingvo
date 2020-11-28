build_linux: build_angular build_electron_linux

build_angular:
	 docker build -f=Dockerfile ./app/ -t angular

build_electron_linux:
	docker build -f=DockerfileElectron ./app/ -t electron-app
	docker run --rm --entrypoint cat electron-app /app/out/make/deb/x64/mvd.linngvoprocessor_1.0.0_amd64.deb > ./deb/release.deb
