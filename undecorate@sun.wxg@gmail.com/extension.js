const Lang = imports.lang;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const WindowMenu = imports.ui.windowMenu.WindowMenu;

let old_buildMenu = {};
let maxID = null, unmaxID = null;

let new_buildMenu = function(window) {
	let old = Lang.bind(this, old_buildMenu);
	old(window);

	this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

	if (window.decorated) {
		this.addAction(_("Undecorate"), Lang.bind(this, function(event) {
						//let ID = activeWindowId();
						undecorate();
						//activeWindow(ID);
		}));
	} else {
		this.addAction(_("Decorate"), Lang.bind(this, function(event) {
						//let ID = activeWindowId();
						decorate();
						//activeWindow(ID);
		}));
	}
};

function undecorate() {
	GLib.spawn_command_line_sync('xprop -id ' + activeWindowId()
			+ ' -f _MOTIF_WM_HINTS 32c -set'
			+ ' _MOTIF_WM_HINTS "0x2, 0x0, 0x0, 0x0, 0x0"');
}

function decorate() {
	GLib.spawn_command_line_sync('xprop -id ' + activeWindowId()
			+ ' -f _MOTIF_WM_HINTS 32c -set'
			+ ' _MOTIF_WM_HINTS "0x2, 0x0, 0x1, 0x0, 0x0"');
}

function activeWindowId() {
	let [,out,,] = GLib.spawn_command_line_sync("xdotool getactivewindow");
	return out.toString();
}

function activeWindow(window) {
	let cmd = ('xdotool windowactivate ' + window);
	GLib.spawn_command_line_sync(cmd);
}

function init() {
	old_buildMenu = WindowMenu.prototype._buildMenu;
}

function enable() {
	WindowMenu.prototype._buildMenu = new_buildMenu;

	//maxID = global.window_manager.connect('maximize', decorate);
	//unmaxID = global.window_manager.connect('unmaximize', undecorate);
}

function disable() {
	WindowMenu.prototype._buildMenu = old_buildMenu;

	if (maxID) 
		global.window_manager.disconnect(maxID);
	if (unmaxID) 
		global.window_manager.disconnect(unmaxID);
}


