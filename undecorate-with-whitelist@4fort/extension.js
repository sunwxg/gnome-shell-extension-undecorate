import GLib from "gi://GLib";
import Meta from "gi://Meta";
import Shell from "gi://Shell";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as WindowMenu from "resource:///org/gnome/shell/ui/windowMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

let old_buildMenu;

let new_buildMenu = function (window) {
  let old = old_buildMenu.bind(this);
  old(window);

  this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

  let item = {};
  if (window.decorated) {
    item = this.addAction(_("Undecorate"), (event) => {
      undecorate(window);
      windowGetFocus(window);
    });

    this.addAction(_("Always Undecorate App"), (event) => {
      const wmClass = getWindowWMClass(window);
      if (wmClass) {
        addToWhitelist(wmClass);
      }
      undecorate(window);
      windowGetFocus(window);
    });
  } else {
    item = this.addAction(_("Decorate"), (event) => {
      decorate(window);
      windowGetFocus(window);
    });

    // Add option to remove from whitelist
    const wmClass = getWindowWMClass(window);
    if (wmClass && isInWhitelist(wmClass)) {
      this.addAction(_("Remove from Whitelist"), (event) => {
        removeFromWhitelist(wmClass);
        decorate(window);
        windowGetFocus(window);
      });
    }
  }
  if (window.get_window_type() == Meta.WindowType.DESKTOP)
    item.setSensitive(false);
};

function undecorate(window) {
  try {
    GLib.spawn_command_line_sync(
      "xprop -id " +
        activeWindowId(window) +
        " -f _MOTIF_WM_HINTS 32c -set" +
        ' _MOTIF_WM_HINTS "0x2, 0x0, 0x0, 0x0, 0x0"'
    );
  } catch (e) {
    console.error(e);
  }
}

function decorate(window) {
  try {
    GLib.spawn_command_line_sync(
      "xprop -id " +
        activeWindowId(window) +
        " -f _MOTIF_WM_HINTS 32c -set" +
        ' _MOTIF_WM_HINTS "0x2, 0x0, 0x1, 0x0, 0x0"'
    );
  } catch (e) {
    console.error(e);
  }
}

function activeWindowId(window) {
  try {
    return parseInt(window.get_description(), 16);
  } catch (e) {
    console.error(e);
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

function getWindowWMClass(window) {
  try {
    const app = Shell.WindowTracker.get_default().get_window_app(window);
    if (app) {
      const appId = app.get_id();
      return appId.replace(".desktop", "");
    }
  } catch (e) {
    console.error(`Error getting window class: ${e}`);
  }
  return null;
}

export default class UndecorateExtension extends Extension {
  constructor(metadata) {
    super(metadata);

    old_buildMenu = WindowMenu.WindowMenu.prototype._buildMenu;
  }

  enable() {
    WindowMenu.WindowMenu.prototype._buildMenu = new_buildMenu;

    this._settings = this.getSettings();
    this._whitelist = this._settings.get_strv("window-whitelist");

    // Set this extension instance as stateObj for global function access
    const extensionObj = Main.extensionManager.lookup(
      "undecorate-with-whitelist@4fort"
    );
    if (extensionObj) {
      extensionObj.stateObj = this;
    }

    // Connect to window creation events to check whitelist
    this._windowCreatedId = global.display.connect(
      "window-created",
      this._onWindowCreated.bind(this)
    );

    this._settingsChangedId = this._settings.connect(
      "changed",
      this._onSettingsChanged.bind(this)
    );

    this._applyWhitelistToExistingWindows();
  }

  disable() {
    WindowMenu.WindowMenu.prototype._buildMenu = old_buildMenu;

    if (this._windowCreatedId) {
      global.display.disconnect(this._windowCreatedId);
      this._windowCreatedId = null;
    }

    if (this._settingsChangedId) {
      this._settings.disconnect(this._settingsChangedId);
      this._settingsChangedId = null;
    }

    this._settings = null;
  }

  _onSettingsChanged(settings, key) {
    if (key === "window-whitelist") {
      this._whitelist = settings.get_strv("window-whitelist");
      this._applyWhitelistToExistingWindows();
    }
  }

  _applyWhitelistToExistingWindows() {
    global.get_window_actors().forEach((actor) => {
      const window = actor.get_meta_window();
      if (window) {
        const wmClass = getWindowWMClass(window);
        if (wmClass && this._whitelist.includes(wmClass)) {
          undecorate(window);
        }
      }
    });
  }

  _onWindowCreated(display, metaWindow) {
    if (metaWindow) {
      const wmClass = getWindowWMClass(metaWindow);
      if (wmClass && this._whitelist.includes(wmClass)) {
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
          undecorate(metaWindow);
          return GLib.SOURCE_REMOVE;
        });
      }
    }
  }

  addToWhitelist(wmClass) {
    if (!this._whitelist.includes(wmClass)) {
      const newWhitelist = [...this._whitelist, wmClass];
      this._settings.set_strv("window-whitelist", newWhitelist);
      this._whitelist = newWhitelist;
    }
  }

  removeFromWhitelist(wmClass) {
    const index = this._whitelist.indexOf(wmClass);
    if (index !== -1) {
      const newWhitelist = [...this._whitelist];
      newWhitelist.splice(index, 1);
      this._settings.set_strv("window-whitelist", newWhitelist);
      this._whitelist = newWhitelist;
    }
  }

  isInWhitelist(wmClass) {
    return this._whitelist.includes(wmClass);
  }
}

function addToWhitelist(wmClass) {
  const extension = Main.extensionManager.lookup(
    "undecorate-with-whitelist@4fort"
  );
  if (extension && extension.stateObj) {
    extension.stateObj.addToWhitelist(wmClass);
  }
}

function removeFromWhitelist(wmClass) {
  const extension = Main.extensionManager.lookup(
    "undecorate-with-whitelist@4fort"
  );
  if (extension && extension.stateObj) {
    extension.stateObj.removeFromWhitelist(wmClass);
  }
}

function isInWhitelist(wmClass) {
  const extension = Main.extensionManager.lookup(
    "undecorate-with-whitelist@4fort"
  );
  if (extension && extension.stateObj) {
    return extension.stateObj.isInWhitelist(wmClass);
  }
  return false;
}
