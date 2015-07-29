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
        parentSel      : '.control-group' // Selector of parent to apply error classes to
        ,missingClass  : 'error' // Class to add to parent if missing
        ,errorClass    : 'warning' // Class to add to parent if input has errors
        ,required      : false // Whether field is required - will detect if required prop is present
        ,requiredHTML  : '<span class="text-error">*</span>' // HTML to add to required inputs' labels
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

/* ===========================================================
 * bootstrap-tooltip.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var defaults = $.fn[this.type].defaults
        , options = {}
        , self

      this._options && $.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      }, this)

      self = $(e.currentTarget)[this.type](options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
