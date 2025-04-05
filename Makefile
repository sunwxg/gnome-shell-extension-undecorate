NAME=undecorate-with-whitelist
DOMAIN=4fort

.PHONY: test all pack install clean

test: install
	@dbus-run-session -- gnome-shell --nested --wayland

all: dist/extension.js

dist/extension.js: undecorate-with-whitelist@4fort/extension.js
	@mkdir -p dist
	@cp undecorate-with-whitelist@4fort/extension.js dist/

schemas/gschemas.compiled: undecorate-with-whitelist@4fort/schemas/org.gnome.shell.extensions.undecorate-with-whitelist.gschema.xml
	glib-compile-schemas undecorate-with-whitelist@4fort/schemas

$(NAME).zip: dist/extension.js schemas/gschemas.compiled
	@cp -r undecorate-with-whitelist@4fort/schemas dist/
	@cp -r undecorate-with-whitelist@4fort/prefs.js dist/
	@cp undecorate-with-whitelist@4fort/metadata.json dist/
	@(cd dist && zip ../$(NAME).zip -9r .)

pack: $(NAME).zip

install: $(NAME).zip
	@mkdir -p ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@rm -rf ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)
	@mv dist ~/.local/share/gnome-shell/extensions/$(NAME)@$(DOMAIN)

clean:
	@rm -rf dist $(NAME).zip