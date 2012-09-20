(function($) {
$.fn.dataTablesTools = {
	defaults: {
		bootstrap: false,
		jQueryUI: false,
		columnFiltering: false,
		selectAll: true
	}
};
$.fn.initDataTables = function( selector, opts ) {
	var options = $.extend($.fn.dataTablesTools.defaults, opts);
	// handle any dataTables
	var $elements = $(selector), 
		dataTableInit = {
			bJQueryUI: options.jQueryUI,
			aaSorting: []
		},
		customDataTableInit = $elements.data('data-table-init');
	if( customDataTableInit != undefined ) {
		$.extend(dataTableInit, customDataTableInit);
	}
	if( options.bootstrap ) {
		$elements
			.addClass('table-striped table-bordered');
		$.extend($.fn.dataTableExt.oStdClasses, {
		    'sWrapper': 'dataTables_wrapper form-inline'
		});
	}
	$elements
		.not('.noDataTable')
		.dataTablePrepare()
		.dataTable(dataTableInit)
		// handle hidden columns
		.each(function() {
			var $table = $(this), offset = 0;
			$table.css('visibility', 'visible').css('height', 'auto');
			$('thead th.hiddenColumn', $table).each(function() {
				$table.dataTable().fnSetColumnVis(
					$('thead th', $table).index(this) + offset++, false 
				);
			});
		});
	if( options.columnFiltering ) {
		// include column filtering support
		$elements.dataTableColumnFiltering();
	}
	else {
		$elements.filter('.colunFiltering').dataTableColumnFiltering();
	}
	// handle selectable dataTables
	$elements.filter('.dataTableSelectable').dataTableSelectable(options);
	// if there's no edit form on the page
	if( $('form input[name=action][value=edit]').length == 0 ) {
		// focus the first filter on the page
		$elements.find('.dataTables_filter input[type=text]').first().focus();
	}

	return $elements;
};
$.fn.dataTablePrepare = function(options) {
	return this.each(function() {
		var $table = $(this);
		if( $('thead', $table).length == 0 ) {
			$('tbody', $table).before('<thead></thead>');
			$('thead', $table).append($('tr:first', $table));
		}
		$table.addClass('dataTable');
		$('.orderBySelection', $table.parentNode).hide();
	});
};
$.fn.dataTableColumnFiltering = function(options) {
	return this.each(function() {
		var $table = $(this),
			$row = $('tfoot tr', $table), $cell;
		if( $row.length == 0 ) {
			$table.append('<tfoot><tr></tr></tfoot>');
			$row = $('tfoot tr', $table);
		}
		$('thead td, thead th', $table).each(function() {
			$row.append('<td>'
				+ ($(this).hasClass('noFiltering') ? ''
					: '<input type="text" placeholder="Filter ' + $(this).text() + '" class="placeholder" tabindex="-1" />')
				+ '</td>'
			);
			$('td:last input', $row).keyup(function () {
				$table.dataTable().fnFilter(
					this.value,
					// Filter on the column (the index) of this element
					$('td', $row).index(this.parentNode)
				);
			});
		});
	});
};
$.fn.dataTableSelectable = function( options ) {
	return this.each(function() {
		var $table = $(this).dataTable(), $row, checked, i;
		var handler = function(e, loading) {
			var $checkbox = $('input[type=checkbox]', this);
			// clicking in an input or a link doesn't select the row
			if( e && $(e.target).is('input, textarea, a') && e.target != $checkbox.get(0) ) {
				return;
			}
			// if the row was clicked then toggle the checkbox
			if( e && !$checkbox.filter(e.target).length ) {
				checked = $checkbox.prop('checked', !$checkbox.prop('checked'));
				$checkbox.trigger('change');
			}
			else { // it's already been toggled
				checked = $checkbox.prop('checked') || false;
			}
			$(this).toggleClass('row_selected', checked);
			if( !loading ) {
				$table.trigger('dataTableSelection', [$table.dataTableNumSelected()]);
			}
		};
		$($table.fnGetNodes()).each(function() {
			$(this).bind('click', handler)
				.find('input[type=checkbox]').bind('change', function() {
					handler.call($(this).closest('tr'));
				});
			handler.call(this, null, true);
		});
		$table.trigger('dataTableSelection', [$table.dataTableNumSelected()]);
		$table.parents().filter('form').submit(function() {
			$(this).append(
				// create a hidden div
				$(document.createElement('DIV')).hide()
				// append all the checkboxes to this so the off-page ones are included
				.append($('input[type=checkbox]', $table.fnGetNodes()))
			); // and add this to the form
		});
		if( options.selectAll ) {
			$table.before('<div class="dataTables_selection"><a class="link all">Select all</a> <a class="link none">Deselect all</a></div>');
			$('a.all, a.none', $table.parent()).click(function() {
				$link = $(this);
				var filtered = $table.fnSettings().aiDisplay,
					rows = [], i;
				for( i = 0; i < filtered.length; i++ ) {
					rows.push($table.fnGetNodes(filtered[i]));
				}
				var checked = $link.hasClass('all');
				$(rows).each(function() {
					$('input[type=checkbox]', this).each(function() {
						$(this).prop('checked', checked);
						$(this).trigger('change');
					});
					$(this).toggleClass('row_selected', checked);
				});
				$table.trigger('dataTableSelection', [$table.dataTableNumSelected()]);
			});
		}
	});
};
$.fn.dataTableNumSelected = function() {
	var $table = $(this).dataTable(), $row, checked, i;
	return $(':checked', $table.fnGetNodes()).length;
};
})(jQuery);