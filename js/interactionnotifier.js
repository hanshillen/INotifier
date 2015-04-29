/*global jQuery, $, console*/
/*jslint browser: true*/

/**
 * @namespace Global namespace for TPG related classes (such as FormValidator) and other relevant properties
 */
var TPG = TPG || {};

(function ($) {
    "use strict";

    function InteractionNotifier(buttonParent, buttonAppend, jsonPaths) {
        /* Private Vars */
        var that = this,
            widgetShortcuts = {};

        /* Public vars */
        that.strGlobalWidgetset = 'json/widgetset.json';
        that.objLastFocused = null;

        function closeDialog() {
            if (that.objLastFocused) {
                that.objLastFocused.focus();
            }
            $('#TPGHelp').remove();
        }

        function getShortcutSet(widgetId, $container) {
            console.log("-->" + widgetId);
            console.log(widgetShortcuts[widgetId]);
            if (!widgetId || !widgetShortcuts[widgetId]) {
                return;
            }
            
            var $objHeading,
                $objList,
                shortcutsObj;

            shortcutsObj = widgetShortcuts[widgetId];
            if (!shortcutsObj) {
                return;
            }
            console.log(widgetId + "<--");
            console.log(shortcutsObj.name + "!!!");
            $objHeading = $('<h3></h3>').attr('tabindex', '-1').text(shortcutsObj.name).appendTo($container);
            $objList = $("<ul></ul>").appendTo($container);
            $.each(shortcutsObj.shortcuts, function (key, value) { // Each keyboard shortcut
                var $objItem,
                    $objKey;
                $objItem = $("<li></li>").attr('tabindex', '-1').appendTo($objList);
                $objKey = $("<kbd></kbd>").text(value.shortcut);
                $objItem.append($objKey).append(' - ' + value.desc);
                $objList.append($objItem);
            });
        }

        function showShortcutDialog(shortcutIds, includesCurrentFocus) {
            var objExisting,
                $shortcutsContainer,
                $close,
                $instructions,
                iTop,
                iLeft,
                objKey,
                $objHeading,
                objList,
                objItem,
                iIndex;
            console.log(shortcutIds);
            objExisting = $('#TPGHelp');
            if (objExisting.length) { // Toggle off if the dialog exists
                closeDialog();
            } else {
                // Add dialog with the shortcuts
                console.log("bahlll");
                if (!shortcutIds || !shortcutIds.current || !shortcutIds.parents || (!shortcutIds.current.length && !shortcutIds.parents.length && !shortcutIds.global.length && !shortcutIds.children.length)) {
                    return;
                }
                
                $shortcutsContainer = $("<div></div>").attr('id', 'TPGHelp').attr('role', 'alertdialog').attr('aria-labelledby', 'kbshortcuts');
                $close = $("<button>Close</button>").click(closeDialog).appendTo($shortcutsContainer);
                $instructions = $("<div></div>").appendTo($shortcutsContainer);
                $objHeading = $("<h1></h1>").attr('tabindex', '-1').attr('id', 'kbshortcuts').text('Keyboard shortcuts').appendTo($instructions);
                
                
                
                
                $.each(["current", "parents"], function (i, e) {
                    var $shortcutSetContainer,
                        $groupHeading,
                        shortcutSet,
                        current;
                    shortcutSet = shortcutIds[e];

                    if (shortcutSet instanceof Array && shortcutSet.length) {
                        current = e === "current";
                        $shortcutSetContainer = $("<div class='tpg-widgetShortcuts'></div>").appendTo($instructions);
                        $groupHeading = $("<h2></h2>").text(e === "current" ? "Current Element" : "Inherited").appendTo($shortcutSetContainer);
                        $.each(shortcutSet, function (i, widgetId) {
                            getShortcutSet(widgetId, $shortcutSetContainer);
                            console.log($shortcutSetContainer);
                        });
                    }
                });

                
                // Allow the cursor keys to scroll through the keyboard shortcuts
                $shortcutsContainer.appendTo(document.body).keydown(function (e) {
                    var $objFocusable = $('#TPGHelp [tabindex=-1]');

                    switch (e.keyCode) {
                    case 38: // UP ARROW
                        iIndex = $objFocusable.index($(e.target));

                        if (iIndex < 1) {
                            $objFocusable.eq($objFocusable.length - 1).focus();
                        } else {
                            $objFocusable.eq(iIndex - 1).focus();
                        }
                        e.preventDefault();
                        break;
                    case 40: // DOWN ARROW
                        iIndex = $objFocusable.index($(e.target));

                        if (iIndex === -1 || iIndex >= $objFocusable.length - 1) {
                            $objFocusable.eq(0).focus();
                        } else {
                            $objFocusable.eq(iIndex + 1).focus();
                        }
                        e.preventDefault();
                        break;
                    }
                });
                
                iTop = (window.pageYOffset || document.documentElement.scrollTop) + 16;
                iLeft = Math.abs(($(window).width() / 2) + $(window).scrollLeft() - 330);
                $shortcutsContainer.css("top", iTop);
                $shortcutsContainer.css("left", iLeft);
                $($close).focus();
            }
        }

        that.addShortcutsJSON = function (jsonPaths) {
            jsonPaths = jsonPaths instanceof Array ? jsonPaths : [jsonPaths];
            $.each(jsonPaths, function (i, e) {
                $.getJSON(e, function (data) {
                    $.each(data, function (widgetId, shortcutsObj) { // Each widget
                        widgetShortcuts[widgetId] = shortcutsObj;
                    });
                });
            });
        };

        that.getWidgetShortcuts = function () {
            return widgetShortcuts;
        };

        function getGlobalShortcutsChain() {

        }

        function getShortcutsChain($target, global) {
            var $shortcutsChain,
                shortcutChainIds,
                encounteredSoFar = [],
                dataAttribValue;
            shortcutChainIds = {
                current: [],
                parents: [],
                global: [],
                children: []
            };

            if (global) {
                dataAttribValue = $(document.body).attr("data-keyboardhelp");
                if (dataAttribValue) {
                    shortcutChainIds.global = dataAttribValue.split(" ");
                }
                $shortcutsChain = $("[data-keyboardhelp]");
            } else {
                $shortcutsChain = $target.parents().andSelf().filter("[data-keyboardhelp]");
            }

            if (!$shortcutsChain.length && !shortcutChainIds.global.length) {
                return false;
            }

            $shortcutsChain.each(function (i, e) {
                var $node = $(this),
                    dataAttrib = $node.attr("data-keyboardhelp"),
                    shortcutIds;
                if (dataAttrib) {
                    shortcutIds = dataAttrib.split(" ");
                }

                $.each(shortcutIds, function (i, e) {
                    if ($.inArray(e, encounteredSoFar) === -1) {
                        shortcutChainIds[global ? "children" : ($node.is($target) ? "current" : "parents")].push(e);
                        encounteredSoFar.push(e);
                    }
                });
            });
            return shortcutChainIds;
        }

        function init(strTarget, bAppend, jsonPaths) {
            var $keyboardHelpBtn,
                $target;
            // Add keyboard help button
            $keyboardHelpBtn = $("<button></button>").text("Keyboard Help").attr('id', 'kybhlpbtn').click(function () {
                var $target = $(this);
                that.objLastFocused = $target;
                showShortcutDialog(getShortcutsChain($target), true);
            });
            $target = $(strTarget);

            if (!$target.length) {
                $target = $(document.body);
            }
            $keyboardHelpBtn[bAppend ? "appendTo" : "prependTo"]($target.first());

            // load JSON

            if (jsonPaths) {
                that.addShortcutsJSON(jsonPaths);
            }

            // Set up context-sensitive handlers
            $(document).keydown(function (e) {
                var $target;
                if (e.keyCode === 112 && e.altKey) { // F1
                    $target = $(e.target);
                    that.objLastFocused = $target;
                    showShortcutDialog(getShortcutsChain($target));
                }
            });

            // Keyboard handler
            $(document).keydown(function (e) {
                var objExisting = document.getElementById('TPGHelp');

                switch (e.keyCode) {
                case 9: // TAB
                    if (objExisting) {
                        // Non modal, so remove it user tabbed elsewhere
                        $(objExisting).remove();
                        if (that.objLastFocused) {
                            that.objLastFocused.focus();
                        }
                    }
                    break;
                case 27: // ESC
                    if (objExisting) {
                        $(objExisting).remove();
                        if (that.objLastFocused) {
                            that.objLastFocused.focus();
                        }
                    }
                    break;
                }
            });

            // Mouse handler
            $(document).mousedown(function (e) {
                var objExisting = document.getElementById('TPGHelp'),
                    objTarget = e.target,
                    bInDom = false;

                if (objExisting) {
                    // Remove keyboard help dialog if clicked outside the dialog, and not the button to launch it
                    if (!$(objTarget).parents().is('#TPGHelp') && objTarget.getAttribute('id') !== 'kybhlpbtn') {
                        if (!bInDom) {
                            $(objExisting).remove();
                        }
                    }
                }
            });
        }
        init(buttonParent, buttonAppend, jsonPaths);
    }
    TPG.InteractionNotifier = InteractionNotifier;
}(jQuery));