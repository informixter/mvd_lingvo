build_linux: build_angular build_electron_linux

build_angular:
	 docker build -f=Dockerfile ./app/ -t angular

build_macos:
	cd app/angular-app/ && npm i
	cd app && npm i
	rm -rf app/angular-app/node_modules
	cd app && npm run make


build_electron_linux:
	docker build -f=DockerfileElectron ./app/ -t electron-app
	docker run --rm --entrypoint cat electron-app /app/out/make/deb/x64/mvd.lingvoprocessor_1.0.0_amd64.deb > ./deb/release.deb
