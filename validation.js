/*
 * jquery-bootstrap-validator.js v1.0.1
 * A small jQuery plugin that validates form fields live.
 *
 * Copyright (C) 2013-2015  Pieter Engelbrecht
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
;(function($, window, document, undefined) {
    /**
     * Storing of plugin name incase we want to change it later
     *
     * @type  {String}
     */
    var pluginName = 'validator';

    /**
     * Plugin constructor
     *
     * @param  {DOM Element}  element  DOM element to which plugin is applied
     * @param  {Object}       options  Options to overwrite the default
     */
    function Plugin(element, options) {
        // Store a jQuery reference to the element
        this.$element = $(element);
        // IE9 does not support the selector :required so use the below instead
        var required = {required: $(element).is('[required]')};
        // Set the option to extend the defaults
        // Stored data extends defaults which is extended by options passed in
        this.options = $.extend(
                            {},
                            $.fn[pluginName].defaults,
                            required,
                            this.$element.data(),
                            options
                        );

        // Holds error messages of checker(s) that failed
        this.errors = '';

        // Indicates whether input data is missing if required
        this.missing = false;

        // Initialize the plugin instance
        this.init();
    }

    Plugin.prototype = {
        init: function() {
            var $e = this.$element;
            // Setup tooltip for input
            $e.attr('title', '').tooltip({
                                        'placement': 'bottom',
                                        'trigger': 'focus',
                                        'html': true,
                                        'animation': false
                                    });
            // Enable checker if needed
            if (this.options.enableChecker && this.options.check !== undefined) {
                this.enableChecker();
            } else {
                this.options.enabledChecker = false;
            }
            this.setRequired(this.options.required);

            $e.on('blur.' + pluginName, $.proxy(function(e) {
                e.stopPropagation();

                var val  = $e.val(),
                    valT = $.trim(val);
                // If they are not the same then remove the extra spaces from the input
                // This is only done if needed to prevent a loop
                if (val != valT) {
                    $e.val(valT);
                }

                // If value blank and required then it is missing
                if (valT !== '') {
                    // Check that input is still ok
                    $e.trigger('input.' + pluginName);
                    this.missing = false;
                } else {
                    this.missing = this.options.required;
                    this.errors = '';
                }

                $e.parents(this.options.parentSel).removeClass(this.options.missingClass +
                                                                ' ' + this.options.errorClass);
                if (this.missing) {
                    $e.parents(this.options.parentSel).addClass(this.options.missingClass);
                } else if (this.errors !== '') {
                    $e.parents(this.options.parentSel).addClass(this.options.errorClass);
                }
                // So that it doesn't hang there when input does not have focus
                $e.tooltip('hide');
            }, this));
        },
        destroy: function() {
            var $e = this.$element;
            // Remove classes, listeners and tooltip
            $e.parents(this.options.parentSel).removeClass(this.options.missingClass +
                                                                ' ' + this.options.errorClass);
            $e.off('.' + pluginName);
            $e.tooltip('destroy');
            $e.removeData();
        },
        enableChecker: function() {
            var check = this.options.check;
            // Check function exists before it is enables and that enable is set
            if (typeof $.fn[pluginName].checks[check] === 'function') {
                var $e = this.$element;
                this.options.enabledChecker = true;
                /*
                Input events detect autocomplete with pastes
                propertychange is for IE < 9 which does not support input
                 */
                $e.on('input.' + pluginName + ' propertychange.' + pluginName, $.proxy(function(e) {
                    // If it's the propertychange event, make sure it's the value that changed.
                    // Else a loop happens in IE when the class and title of tooltip update triggers propertychange
                    if (window.event && event.type == "propertychange" && event.propertyName != "value")
                        return;

                    e.stopPropagation();
                    this.errors = '';
                    // Call the checker with the value
                    // Also provide a callback to the _addError function setting its this
                    $.fn[pluginName].checks[check]($e.val(), this._addError.bind(this));

                    // Update tooltip with new errors
                    this._updateTooltip();
                }, this));
            } else {
                console.log(check + ' is not a function that exists in $.fn.' +
                                                                    pluginName + '.checks');
                this.options.enableChecker = false;
            }
        },
        disableChecker: function() {
            var $e = this.$element;
            // Set new value
            this.options.enabledChecker = false;
            this.errors = '';
            // Turn listeners off
            $e.off('input.' + pluginName + ' propertychange.' + pluginName);
            // Update classes
            $e.parents(this.options.parentSel).removeClass(this.options.errorClass);
            // Update tooltip
            this._updateTooltip();
        },
        setChecker: function(check) {
            this.disableChecker();
            this.options.check = check;
            this.enableChecker();
        },
        _updateTooltip: function() {
            if (this.errors !== '') {
                this.$element.attr('title', this.errors).tooltip('fixTitle').tooltip('enable').tooltip('show');
            } else {
                this.$element.attr('title', '').tooltip('fixTitle').tooltip('hide').tooltip('disable');
            }
        },
        setRequired: function(req) {
            // To set default to true
            req = req === undefined ? true : req;

            this.options.required = req;

            var $e = this.$element,
                $label = $('[for="' + $e.attr('id') + '"]');

            // Only update if the input has a label
            if ($label.length === 1) {
                var $requiredHtml = $(this.options.requiredHTML);
                // Check if option is now set to required
                if (req === true) {
                    // Don't add other if one is already set  - has the requiredHtml
                    if ($label.children($requiredHtml).length === 0) {
                        $requiredHtml.appendTo($label).css({
                                                        display: 'inline-block',
                                                        overflow: 'hidden'
                                                    });
                        // Get width for a nice animation
                        var reqWidth = $requiredHtml.width();
                        $requiredHtml.css('width', '0').animate({'width': reqWidth}, 600);
                    }
                } else {
                    // Animate it out then remove
                    $label.children($requiredHtml).animate({'width': '0'}, 500,
                                                                function() {$(this).remove();}
                                                            );
                    $e.parents(this.options.parentSel).removeClass(this.options.missingClass);
                }
            }
        },
        isValid: function() {
            // Rerun checks
            this.$element.trigger('blur.' + pluginName);

            return !this.missing && (this.errors === '');
        },
        _addError: function(error) {
            this.errors += this.errors === '' ? error : '<br />' + error;
        }
    };

    // Plugin constructor to prevent against multiple plugin instances
    $.fn[pluginName] = function(options) {
        var args = arguments,
            selector = 'input[type!="radio"][type!="checkbox"], textarea';

        // Filter this to only contain valid inputs
        var inputs = this.filter(selector).add(this.find(selector));

        if (options === undefined || typeof options === 'object') {
            return inputs.each(function() {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
                }
            });
        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {
            // Call a public plugin method for each element
            if (options === 'isValid') {
                // Check each element if it is valid; return false if one invalid
                var valid =  true;

                inputs.each(function() {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin) {
                        // If one inValid is found then whole set invalid
                        if (!instance.isValid()) {
                            valid = false;
                        }
                    }
                });
                return valid;
            } else {
                // Invoke the specified method on each selected element
                return inputs.each(function() {
                    var instance = $.data(this, 'plugin_' + pluginName);
                    if (instance instanceof Plugin && typeof instance[options] === 'function') {
                        instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                    }
                });
            }
        }
    };

    /**
     * Default options
     */
    $.fn[pluginName].defaults = {
        parentSel      : '.form-group' // Selector of parent to apply error classes to
        ,missingClass  : 'has-error' // Class to add to parent if missing
        ,errorClass    : 'has-warning' // Class to add to parent if input has errors
        ,required      : false // Whether field is required - will detect if required prop is present
        ,requiredHTML  : '<span class="text-danger pull-right">&nbsp;*</span>' // HTML to add to required inputs' labels
        ,enableChecker : true // Whether checker is enabled
    };
    /*
     * Default error messages for checkers which can be overwritten for translation purposes
     * Can be expanded with own for one's own checks
     */
    $.fn[pluginName].errors = {
         noDigits        : 'No digits allowed'
        ,noSymbols       : 'No symbols allowed'
        ,onlyDigits      : 'Only digits allowed'
        ,isEmail         : 'Must be in a valid email format: name@domain.com'
        ,noSpecial       : 'No special keys allowed'
        ,noAlpha         : 'No alphabeticals allowed'
        ,noForeign       : 'No foreign characters allowed'
    };
    /*
     * Build in checks
     * Can be expanded with own or overwritten
     */
    $.fn[pluginName].checks = {
        noDigits    : function(val, addError) {
                        /\d/.test(val) && addError($.fn[pluginName].errors.noDigits);
                      },
        noSymbols   : function(val, addError) {
                        // See http://unicode-table.com
                        /[!-/:-@{-~[-`]/.test(val) && addError($.fn[pluginName].errors.noSymbols);
                      },
        isText      : function(val, addError) {
                        this.noDigits(val, addError);
                        this.noSymbols(val, addError);
                        this.noSpecial(val, addError);
                      },
        onlyDigits    : function(val, addError) {
                        /\D/.test(val) && addError($.fn[pluginName].errors.onlyDigits);
                      },
        isEmail     : function(val, addError) {
                        this.noSpecial(val, addError);
                        !/^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(val)
                                && addError($.fn[pluginName].errors.isEmail);
                      },
        noSpecial     : function(val, addError) {
                        // See http://unicode-table.com
                        /[\u0000-\u001F\u0080-\u009F]/.test(val)
                                            && addError($.fn[pluginName].errors.noSpecial);
                      },
        noAlpha       : function(val, addError) {
                        /[a-zA-Z]/.test(val) && addError($.fn[pluginName].errors.noAlpha);
                      },
        noForeign     : function(val, addError) {
                        /[\u00C0-\u1FFFF]/.test(val) && addError($.fn[pluginName].errors.noForeign);
                      }
    };

    function createInstance(element, options) {
        if (!$.data(element, 'plugin_' + pluginName)) {
            $.data(element, 'plugin_' + pluginName, new Plugin(element, options));
        }
    }
})(jQuery, window, document);
