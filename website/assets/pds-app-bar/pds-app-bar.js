(function (window, document, undefined) {
  if (window.PDS_App_Bar !== undefined) {
    return;
  }

  // log proxy function
  var log = function (msg) {
      window.console.log(msg);
    },
    scriptLoader = function (script, func) {
      if (script.onload === undefined) {
        // IE lack of support for script onload
        if (script.onreadystatechange !== undefined) {
          var intervalFunc = function () {
            if (
              script.readyState !== "loaded" &&
              script.readyState !== "complete"
            ) {
              window.setTimeout(intervalFunc, 250);
            } else {
              // it is loaded
              func();
            }
          };
          window.setTimeout(intervalFunc, 250);
        } else {
          log("ERROR: We can't track when script is loaded");
        }
      } else {
        return func;
      }
    };

  window.PDS_App_Bar = function () {
    var app_bar = document.createElement("div"),
      bar_first = document.createElement("div"),
      bar_second = document.createElement("div");
    app_bar.setAttribute("id", "pds-app-bar");
    bar_first.className = "pds-app-bar-section";
    bar_second.className = "pds-app-bar-section";

    var bar_title = document.createElement("a"),
      bar_logo = document.createElement("img");
    bar_title.setAttribute("id", "pds-app-bar-title");
    bar_title.href = "https://pds.nasa.gov/";
    bar_title.target = "_blank";
    bar_title.innerHTML =
      "<img src='https://pds.nasa.gov/pds-app-bar/images/PDS_Planets-acr-inv-bw.png' alt=''>Planetary Data System";
    bar_first.appendChild(bar_title);

    var info_container = document.createElement("div"),
      info_icon = document.createElement("img"),
      info_text = document.createElement("div");
    info_container.setAttribute("id", "pds-app-bar-info");
    info_container.setAttribute("tabindex", "0");
    info_icon.setAttribute("alt", "PDS Information");
    info_icon.setAttribute(
      "src",
      "https://pds.nasa.gov/pds-app-bar/images/info.svg"
    );
    info_text.innerHTML =
      "Find a Node - Use these links to navigate to any of the 8 publicly accessible PDS Nodes." +
      "<br/><br/>" +
      "This bar indicates that you are within the PDS enterprise which includes 6 science discipline nodes and 2 support nodes which are overseen by the Project Management Office at NASA's Goddard Space Flight Center (GSFC). " +
      "Each node is led by an expert in the subject discipline, supported by an advisory group of other practitioners of that discipline, and subject to selection and approval under a regular NASA Research Announcement.";

    info_container.appendChild(info_icon);
    info_container.appendChild(info_text);

    var dropdown_container = document.createElement("div"),
      dropdown_link = document.createElement("a"),
      dropdown_caret = document.createElement("span"),
      dropdown_list = document.createElement("ul");
    dropdown_container.setAttribute("id", "pds-app-bar-dropdown");
    dropdown_container.classList.add("dropdown-content");
    dropdown_link.textContent = "Find a Node";
    dropdown_link.setAttribute("tabindex", "0");
    dropdown_link.classList.add("nav");
    dropdown_link.appendChild(dropdown_caret);

    var nodes = new Map();
    nodes
      .set("atm", ["Atmospheres (ATM)", "https://pds-atmospheres.nmsu.edu/"])
      .set("img", [
        "Cartography and Imaging Sciences (IMG)",
        "https://pds-imaging.jpl.nasa.gov/",
      ])
      .set("geo", ["Geosciences (GEO)", "https://pds-geosciences.wustl.edu/"])
      .set("naif", [
        "Navigation & Ancillary Information Facility (NAIF)",
        "https://naif.jpl.nasa.gov/naif/",
      ])
      .set("ppi", [
        "Planetary Plasma Interactions (PPI)",
        "https://pds-ppi.igpp.ucla.edu/",
      ])
      .set("rms", ["Ring-Moon Systems (RMS)", "https://pds-rings.seti.org/"])
      .set("sbn", [
        "Small Bodies (SBN)",
        "https://pds-smallbodies.astro.umd.edu/",
      ]);
    for (let value of nodes.values()) {
      let node = document.createElement("a");
      node.textContent = value[0];
      node.href = value[1];
      node.target = "_blank";
      let li = document.createElement("li");
      li.appendChild(node);
      li.classList.add("node");
      dropdown_list.appendChild(li);
    }
    dropdown_container.appendChild(dropdown_link);
    dropdown_container.appendChild(dropdown_list);

    bar_second.appendChild(info_container);
    bar_second.appendChild(dropdown_container);

    app_bar.appendChild(bar_first);
    app_bar.appendChild(bar_second);

    document.body.insertBefore(app_bar, document.body.firstChild);

    var bar_first_style = bar_first.currentStyle || window.getComputedStyle(bar_first);
    info_text.style.left = (bar_first.offsetWidth + parseFloat(bar_first_style.marginRight)).toString() + "px";

    document.body.onclick = function (e) {
        // if the user clicks on the dropdown menu and it's active, close it...
        if (e.composedPath && e.composedPath().some((el) => el.id === "pds-app-bar-dropdown")) {
            if (e.composedPath().some((el) => (el.classList !== undefined && el.classList.contains("node")))) {
                 dropdown_container.classList.remove("active");
            }
        } else {
            if (dropdown_container.classList.contains("active")) {
                dropdown_container.classList.remove("active");
            }
        }
    };

    // dropdown the menu on both click and mouseover
    document.body.addEventListener('mouseout', function(e) {
        // if the mouse moves from th app bar dropdown out of that element space, then close the dropdown
        if ((e.srcElement && e.srcElement.closest("#pds-app-bar-dropdown") !== null) &&
            (e.relatedTarget && e.relatedTarget.closest("#pds-app-bar-dropdown") == null)) {
            dropdown_container.classList.remove("active");
        }
    });

    dropdown_caret.onclick = function (e) {
        dropdown_container.classList.toggle("active");
        e.stopPropagation();
        return false;
    }

    dropdown_link.onclick = function (e) {
        dropdown_container.classList.add("active");
        dropdown_link.focus();
        let list_elements = dropdown_list.children;
        for (let list_index = 0; list_index < list_elements.length; list_index++) {
            list_elements[list_index].setAttribute("tabindex", list_index);
        }
    };

    // add the event listner for the up/down/enter actions on the menu
    document.body.addEventListener("keydown", (e) => {
        let elem = e.target;
        let list_index = elem.getAttribute("tabindex");
        if (list_index !== undefined && dropdown_container.classList.contains("active")) {
            let list_elements = dropdown_list.children;
            list_elements[list_index].focus();
            switch (e.code) {
                case "Escape":
                case "Tab":
                    // close the dropdown
                    dropdown_container.classList.remove("active");
                    dropdown_link.focus();
                    break;
                case "ArrowUp":
                    list_index--;
                    list_index = (list_index < 0 ? list_elements.length - 1 : list_index);
                    list_elements[list_index].focus();
                    break;
                case "ArrowDown":
                    list_index++;
                    list_index = (list_index === list_elements.length ? 0 : list_index);
                    list_elements[list_index].focus();
                    break;
                case "Enter":
                case "NumpadEnter":
                    // select the menu item
                    window.open(list_elements[list_index].firstElementChild.href, "_blank");
                    dropdown_container.classList.remove("active");
                    dropdown_link.focus();
                    break;
            }
            e.preventDefault();
            return false;
        }
    });

    dropdown_link.onmouseover = function (e) {
        dropdown_container.classList.add("active");
        dropdown_link.focus();
    };

    info_container.onmouseover = function () {
      info_container.classList.add("active");
    };
    info_container.onmouseout = function () {
      info_container.classList.remove("active");
    };
    info_container.onfocus = function () {
      info_container.classList.add("active");
    };
    info_container.onblur = function () {
      info_container.classList.remove("active");
    };
    info_container.addEventListener("keydown", (evt) => {
      if (evt.code === "Escape") {
        info_container.classList.remove("active");
      }
    });
  };

  // Initialize
  if (document.readyState != "loading") PDS_App_Bar();
  else
    document.addEventListener("DOMContentLoaded", function () {
      PDS_App_Bar();
    });
})(window, document);
