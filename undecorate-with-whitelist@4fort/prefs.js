import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import GObject from "gi://GObject";

import {
  ExtensionPreferences,
  gettext as _,
  ngettext,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const WhitelistRow = GObject.registerClass(
  class WhitelistRow extends Adw.ActionRow {
    constructor(appId, removeCallback) {
      const displayName = formatAppDisplayName(appId);

      super({
        title: displayName,
        subtitle: appId, // Show full ID as subtitle for reference
      });

      const removeButton = new Gtk.Button({
        icon_name: "list-remove-symbolic",
        valign: Gtk.Align.CENTER,
        css_classes: ["destructive-action"],
        tooltip_text: _("Remove from whitelist"),
      });

      removeButton.connect("clicked", () => {
        removeCallback(appId);
      });

      this.add_suffix(removeButton);
    }
  }
);

function formatAppDisplayName(appId) {
  try {
    const parts = appId.split(".");

    if (parts.length > 1) {
      const name = parts[parts.length - 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }

    return appId;
  } catch (e) {
    return appId;
  }
}

export default class UndecoratePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: _("Settings"),
      icon_name: "preferences-system-symbolic",
    });
    window.add(page);

    const whitelistGroup = new Adw.PreferencesGroup({
      title: _("Undecorated Applications"),
      description: _("Applications in this list will always start undecorated"),
    });
    page.add(whitelistGroup);

    const whitelist = settings.get_strv("window-whitelist");
    const whitelistCountRow = new Adw.ActionRow({
      title: _("Apps in Whitelist:"),
      subtitle:
        whitelist.length > 0
          ? ngettext(
              "%d application",
              "%d applications",
              whitelist.length
            ).format(whitelist.length)
          : _("No applications in whitelist"),
    });
    whitelistGroup.add(whitelistCountRow);

    this.whitelistBox = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ["boxed-list"],
      margin_top: 10,
    });
    whitelistGroup.add(this.whitelistBox);

    if (whitelist.length === 0) {
      const emptyRow = new Adw.ActionRow({
        title: _("No applications in whitelist"),
        subtitle: _("Add applications below to automatically undecorate them"),
        css_classes: ["dim-label"],
      });
      this.whitelistBox.append(emptyRow);
    }

    this.populateWhitelist(settings);

    const addRow = new Adw.ActionRow({
      title: _("Add Application to Whitelist"),
    });
    whitelistGroup.add(addRow);

    const entryBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 6,
      valign: Gtk.Align.CENTER,
      hexpand: true,
    });

    const entry = new Gtk.Entry({
      hexpand: true,
      placeholder_text: _("Enter application ID"),
    });

    const addButton = new Gtk.Button({
      icon_name: "list-add-symbolic",
      tooltip_text: _("Add to whitelist"),
    });

    addButton.connect("clicked", () => {
      const text = entry.get_text();
      if (text && text.length > 0) {
        this.addToWhitelist(settings, text);
        entry.set_text("");
      }
    });

    entry.connect("activate", () => {
      const text = entry.get_text();
      if (text && text.length > 0) {
        this.addToWhitelist(settings, text);
        entry.set_text("");
      }
    });

    entryBox.append(entry);
    entryBox.append(addButton);
    addRow.set_child(entryBox);

    // const noteGroup = new Adw.PreferencesGroup();
    // page.add(noteGroup);

    // const noteRow = new Adw.ActionRow({
    //   title: _("How to find application IDs:"),
    //   subtitle: _(
    //     "You can use the 'xprop WM_CLASS' command and click on a window to get its ID"
    //   ),
    // });
    // noteGroup.add(noteRow);
  }

  populateWhitelist(settings) {
    this.whitelistBox.remove_all();

    const whitelist = settings.get_strv("window-whitelist");

    whitelist.forEach((appId) => {
      const row = new WhitelistRow(appId, (id) => {
        this.removeFromWhitelist(settings, id);
      });
      this.whitelistBox.append(row);
    });
  }

  addToWhitelist(settings, appId) {
    const whitelist = settings.get_strv("window-whitelist");
    if (!whitelist.includes(appId)) {
      whitelist.push(appId);
      settings.set_strv("window-whitelist", whitelist);
      this.populateWhitelist(settings);
    }
  }

  removeFromWhitelist(settings, appId) {
    let whitelist = settings.get_strv("window-whitelist");
    whitelist = whitelist.filter((id) => id !== appId);
    settings.set_strv("window-whitelist", whitelist);
    this.populateWhitelist(settings);
  }
}
