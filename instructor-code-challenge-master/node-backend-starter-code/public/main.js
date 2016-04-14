console.log('here we are again');

var stuff = 'trouse';

function el(tag){
    var elmt = $(document.createElement(tag));
    for (var i=1; i < arguments.length; i++){
	elmt.addClass(arguments[i]);
    }
    return elmt;
}

function pdiv(text){
    return el('p').append(text);
}

function span(text){
    return el('span').append(text);
}

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

var injectResultsLog;

function favoriteButton(title){
    var button = el('button').attr('type', 'submit').append('Favorite!');
    var form = el('form', 'buttonForm').attr('method', 'post').append(button);
    form.submit(function(event){
	console.log('submitting!' + title);
	$.post('/favorite',
	       {title: title},
	       function(x){
		   // really just a put at the moment 
	       });
	event.preventDefault();
    });
    return form;
}

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

function showDetails(id){
    $.post('/details', {id: id},
	  function(data){
	      returnedDetails = data;
	      $('#details').empty().append(detailBox(data));
	  });
}

var clickedThings = [];

function injectResults(results){
    injectResultsLog = results;
    var colkeys = ['Title', 'Year', 'imdbID'];
    var elements = results.map(function(r){return resultElement(r,colkeys);});
    // click handlers
    elements.forEach(function(elmt){
	$(elmt).click(function(event){
	    clickedThings.push(this);
	    showDetails($(this).find('td').last().text());
	});
    });
    var header = el('tr').append(colkeys.map(function(k){return el('th').append(k);}))
    var tab = el('table', 'resultTable').append(header).append(elements);
    $('#results').empty().append(tab);
}

var submissionLog;
var submissionResults;

$(function(){
    $('form[id=search]').submit(function(event){
	submissionLog = {event:event, dataStuff:$(this)}
	$.post('/searching', 
	       $(this).serialize(),
	       function(x){
		   submissionResults = x;
		   console.log('got stuff back; results: ' + x);
		   injectResults(x);});
	$('#results').empty().append(el('div','spinning').append('please wait'));
	event.preventDefault();
    })
});
