
submit:
	cd undecorate@sun.wxg@gmail.com/ && zip -r ~/switchWorkspace.zip *

install:
	rm -r ~/.local/share/gnome-shell/extensions/undecorate@sun.wxg@gmail.com
	cp -r undecorate@sun.wxg@gmail.com ~/.local/share/gnome-shell/extensions/

