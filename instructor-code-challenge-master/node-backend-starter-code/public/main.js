// ============================================================
// dom manipulation conveniences

// creates a dom element with the specified tag; further arguments are
// attached as classes.
function el(tag){
    var elmt = $(document.createElement(tag));
    for (var i=1; i < arguments.length; i++){
	elmt.addClass(arguments[i]);
    }
    return elmt;
}

// ============================================================
// functions for constructing the table of results

function resultElementProperty(val){
    return el('td').append(val);
}

function resultElement(result, colkeys){
    var row = el('tr');
    var elementDivs = colkeys
						.map(function(k){return result[k];})
						.map(resultElementProperty);
    row.append(elementDivs);
    return row;
}

// ============================================================
// functions for constructing the detail view of clicked movies

// make a button to press to register that the user wants to save a movie 
function favoriteButton(title){
    var button = el('button').attr('type', 'submit').append('Favorite!');
    var form = el('form', 'buttonForm').attr('method', 'post').append(button);
    form.submit(function(event){
		$.post('/favorite',
		       {title: title},
		       function(x){
			   // really just a put at the moment 
		       });
		event.preventDefault();
    });
    return form;
}

// render various fields of interest in the more detailed data
function detailBox(data){
    var detailSectioner = function(k, label){
			var sec = el('div', 'detailSection');
			sec.append(el('h5', 'detailSectionLabel').append(label));
			sec.append(el('div', 'detailSectionContents').append(data[k]))
			return sec;
	    };
    return el('div', 'detailBox')
		.append(detailSectioner("Title", "Title"))
		.append(detailSectioner("Type", "Medium"))
	   	.append(detailSectioner("Released", "Released"))
		.append(detailSectioner("Runtime", "Runtime"))
	   	.append(detailSectioner("Plot", "Plot"))
		.append(favoriteButton(data.Title));
}

// given an imdbID, get and render more detailed information on it from omdb
function showDetails(id){
    $.post('/details', {id: id},
	  function(data){
	      returnedDetails = data;
	      $('#details').empty().append(detailBox(data));
	  });
}

// ============================================================
// top; render results of query

// render the table of results
function injectResults(results){
    var colkeys = ['Title', 'Year', 'imdbID'];
    var elements = results.map(function(r){return resultElement(r,colkeys);});
    // click handlers; trigger the detailBox
    elements.forEach(function(elmt){
			$(elmt).click(function(event){
			    showDetails($(this).find('td').last().text());
			});
	    });
    var header = el('tr').append(colkeys.map(function(k){return el('th').append(k);}))
    var tab = el('table', 'resultTable').append(header).append(elements);
    $('#results').empty().append(tab);
}

//============================================================
// init
$(function(){
    $('form[id=search]').submit(function(event){
	$.post('/searching', 
	       $(this).serialize(),
	       function(x){
		   injectResults(x);});
	$('#results').empty().append(el('div','spinning').append('please wait'));
	event.preventDefault();
    })
});
