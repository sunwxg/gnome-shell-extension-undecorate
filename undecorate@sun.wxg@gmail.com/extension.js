const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Meta = imports.gi.Meta;
const PopupMenu = imports.ui.popupMenu;
const WindowMenu = imports.ui.windowMenu.WindowMenu;

let old_buildMenu = {};

let new_buildMenu = function(window) {
    let old = Lang.bind(this, old_buildMenu);
    old(window);

    this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    let item = {};
    if (window.decorated) {
        item = this.addAction(_("Undecorate"), Lang.bind(this, function(event) {
            undecorate();
            windowGetFocus(window);
        }));
    } else {
        item = this.addAction(_("Decorate"), Lang.bind(this, function(event) {
            decorate();
            windowGetFocus(window);
        }));
    }
    if (window.get_window_type() == Meta.WindowType.DESKTOP)
        item.setSensitive(false);
};

function undecorate() {
    try {
        GLib.spawn_command_line_sync('xprop -id ' + activeWindowId()
            + ' -f _MOTIF_WM_HINTS 32c -set'
            + ' _MOTIF_WM_HINTS "0x2, 0x0, 0x0, 0x0, 0x0"');
    } catch(e) {
        log(e);
    }
}

function decorate() {
    try {
        GLib.spawn_command_line_sync('xprop -id ' + activeWindowId()
            + ' -f _MOTIF_WM_HINTS 32c -set'
            + ' _MOTIF_WM_HINTS "0x2, 0x0, 0x1, 0x0, 0x0"');
    } catch(e) {
        log(e);
    }
}

function activeWindowId() {
    let result = [];
    try {
        result = GLib.spawn_command_line_sync("xdotool getactivewindow");
    } catch(e) {
        log(e);
        return;
    }
    return result[1].toString()
}

function windowGetFocus(window) {
    Meta.later_add(Meta.LaterType.IDLE, function () {
        if (window.focus) {
            window.focus(global.get_current_time());
        } else {
            window.activate(global.get_current_time());
        }
    });
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
