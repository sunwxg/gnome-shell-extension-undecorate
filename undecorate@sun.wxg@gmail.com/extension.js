const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const PopupMenu = imports.ui.popupMenu;
const WindowMenu = imports.ui.windowMenu.WindowMenu;

let old_buildMenu = {};

let new_buildMenu = function(window) {
    let old = old_buildMenu.bind(this);
    old(window);

    this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    let item = {};
    if (window.decorated) {
        item = this.addAction(_("Undecorate"), (event) => {
            undecorate(window);
            windowGetFocus(window);
        });
    } else {
        item = this.addAction(_("Decorate"), (event) => {
            decorate(window);
            windowGetFocus(window);
        });
    }
    if (window.get_window_type() == Meta.WindowType.DESKTOP)
        item.setSensitive(false);
};

function undecorate(window) {
    try {
        GLib.spawn_command_line_sync('xprop -id ' + activeWindowId(window)
            + ' -f _MOTIF_WM_HINTS 32c -set'
            + ' _MOTIF_WM_HINTS "0x2, 0x0, 0x0, 0x0, 0x0"');
    } catch(e) {
        log(e);
    }
}

function decorate(window) {
    try {
        GLib.spawn_command_line_sync('xprop -id ' + activeWindowId(window)
            + ' -f _MOTIF_WM_HINTS 32c -set'
            + ' _MOTIF_WM_HINTS "0x2, 0x0, 0x1, 0x0, 0x0"');
    } catch(e) {
        log(e);
    }
}

function activeWindowId(window) {
    try {
        return parseInt(window.get_description(), 16);
    } catch(e) {
        log(e);
        return;
    }
}

function windowGetFocus(window) {
    if (window.focus) {
        window.focus(global.get_current_time());
    } else {
        window.activate(global.get_current_time());
    }
}

function init() {
    old_buildMenu = WindowMenu.prototype._buildMenu;
}

function enable() {
    WindowMenu.prototype._buildMenu = new_buildMenu;
}

function disable() {
    WindowMenu.prototype._buildMenu = old_buildMenu;
}
