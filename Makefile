
submit:
	cd undecorate@sun.wxg@gmail.com/ && gnome-extensions pack --force -o ~/
	cd undecorate@sun.wxg@gmail.com/ && gnome-extensions pack --force

install:
	cd undecorate@sun.wxg@gmail.com/ && gnome-extensions pack --force
	gnome-extensions install --force ./undecorate@sun.wxg@gmail.com/undecorate@sun.wxg@gmail.com.shell-extension.zip
