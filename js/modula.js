var numRighe=1;
var altezzaRighe = [];
altezzaRighe[0]=100;

var colonne = [];

$(function () {

    //Parametri principali: da aggiornare in caso di modifiche all'html
    var nuovaRiga = $('#newRow').html();
    var nuovaColonna = $('#newCol').html();
    minCelWidth=60;
    divisorMin=100;
    divisorMax=300;
    divisorStep=40;
    dividerArray = ['100','140','180','220','260','300'];
    firstSidebar = 'configuration';
    defaultView = '2d';

    //aggiunta spazio orizzontale
    $(".modula_container").on("click", ".addColumn", function() {
        var cel = $(this).closest('td');
        
        if (cel.innerWidth() >= minCelWidth) {
            var table = $(this).closest('table');
            var size = table.attr('size');
            var tds = table.find('td');
            moveDividerHor(true);
            cel.after(nuovaColonna);
            cel.after(nuovaColonna);
            var newCol = cel.siblings('.newCol');
            newCol.effect("highlight", {color: "#CCFF66"}, 500, function() { newCol.removeClass('newCol'); });
            cel.remove();
            tds.attr('size',size);
            moveDividerHor(false);
            sizeDividers('all');
        } else {
            cel.effect("highlight", {color: "#FF6666"}, 500);
        }
        updateDividers('all');
        updatePartitions();
    });

    //rimozione spazio orizzontale
    $(".modula_container").on("click", ".deleteColumn", function() {
        var cel = $(this).parent();
        if (cel.next().is("td") || cel.prev().is("td")){
            moveDividerHor(true);
            cel.effect("highlight", {color: "#FF6666"}, 200/*,function() { $(this).remove(); }*/);
            $(this).parent().remove();
            moveDividerHor(false);
            sizeDividers('all');
        } else {
            cel.effect("highlight", {color: "#FF6666"}, 500);
        }
        updateDividers('all');
        updatePartitions();
    });

    //aggiunta riga
    $("#page-content-wrapper").on("click", ".addRow", function() {
        moveDividerHor(true);
        moveDividerVer(true);
        $(".modula_container").append(nuovaRiga);
        $(".modula_container .sortable:last-child").effect("highlight", {color: "#CCFF66"}, 500);
        numRighe++;
        altezzaRighe[numRighe-1]=100;
        $(".deleteRow").removeClass("disabled");
        $(".enableDrag").removeClass("disabled");
        moveDividerHor(false);
        moveDividerVer(false);
        getTraySize();
        sizeDividers('all');
        updatePartitions();
    });

    //rimozione riga
    $(".modula_container").on("click", ".deleteRow", function() {
        if (numRighe > 1) {
            altezzaRighe.splice($(this).parent().parent().prevAll('.sortable').size(),1);
            $(this).closest('.sortable').effect("highlight", {color: "#FF6666"}, 200, function() { $(this).remove(); });
            numRighe--;
            if (numRighe < 2) {
                $(".enableDrag").addClass("disabled");
                $(".deleteRow").addClass("disabled");
            }
        }
        getTraySize();
        sizeDividers('all');
        updateDividers('all');
    });

    // make cells same width
    $(".modula_container").on("click", ".equalSize", function() {
        moveDividerHor(true);
        var table = $(this).closest('.sortable').children('table');
        // larghezza totale tabella
        var total = table.width();
        // n. di celle
        var cels = table.find('td').length;
        // larghezza diviso n.celle
        var subtotal = total / cels;
        // arrotondo al numero intero
        var width = Math.round(subtotal);
        table.find('td').css('width',width +'px');
        moveDividerHor(false);
        sizeDividers(this);
    });

    //apertura-chiusura menu laterale
    $("#menu-configuration").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });

    //bottone che attiva il drag & drop: disattiva le maniglie 
    //della tabella in modo da non interferire con gli eventi touch
    $("#page-content-wrapper").on("click", ".enableDrag", function() {
        if ($(this).hasClass("active"))
            disableDragging();
        else
            enableDragging();
    });

    $("#slider").noUiSlider({
        start: [20, 80],
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });

});
// get/set dimensioni del Tray generale 
function getTraySize() {
       var L = $('.modula_container').height();
       var W = $('.modula_container').width();
       $('#displayWidth').html(W);
       $('#displayLength').html(L);
       $('#displayLength').closest('.sizeTrace').width(L);
       $('#trayWidth').val(W);
       $('#trayLength').val(L);
       $('#partition-section li').not('headers').find('.width').text(W);
       $('#lLabel').text(L);
}

// get set altezze delle Partitions
function sizePartitions(e) {
    if (e == 'all') {
        // alert('all');
        $('.modula_container .MatrixTable').each(function(){
            var H = $(this).height();
            $(this).closest('.sortable').children('.h-size').html(H);
            $(this).find('td').attr('size',H);
            $(this).attr('size',H);
            // for (var i = 0; i < dividerArray.length; i++) {
            //     cels.removeClass('size'+dividerArray[i]);
            //     tables.removeClass('size'+dividerArray[i]);
            // }
            // cels.addClass('size'+H);
            // tables.addClass('size'+H);
        });
    } else {
        var H = $(e).height();
        altezzaRighe[$(e).parent().prevAll('.sortable').size()]=H;
        $(e).closest('.sortable').children('.h-size').html(H);
        $(e).find('td').attr('size',H);
        $(e).attr('size',H);
        // for (var i = 0; i < dividerArray.length; i++) {
        //     cels.removeClass('size'+dividerArray[i]);
        //     tables.removeClass('size'+dividerArray[i]);
        // }
        // cels.addClass('size'+H);
        // tables.addClass('size'+H);
    }
}

// get set distances of dividers
function sizeDividers(e) {
    var count = 0;
    if (e == 'all') {
        $('.modula_container .MatrixTable td').each(function(){
            var rigaTd = $(this).closest('.sortable').prevAll('.sortable').size();   //numero riga in cui si trova il td
            var colonnaTd = $(this).prevAll('td').size();                              //posizione orizzontale del td
            var W = $(this).width();                                                //larghezza del td
            colonne[count]=[rigaTd, colonnaTd, W];
            count++;
            if ($(this).siblings('td').size() > 0) {
                $(this).children('.w-size').html(W);
            } else {
                $(this).children('.w-size').html('');
            }
        });
    } else {
        $(e).closest('.MatrixTable').children('td').each(function(){
            if ($(this).siblings('td').size() > 0) {
                var W = $(this).width();
                $(this).children('.w-size').html(W);
            } else {
                $(this).children('.w-size').html('');
            }
        });
    }
}

//aggiorna campionario
function updateDividers(e) {
    // var dividers = 0;
    $('#divisor-section li').removeClass('active');
    $('#divisor-section li').not('.headers').find('.rightCol').text('0');
    var tot = 0;
    if (e == 'all') {
        for (var i = 0; i < dividerArray.length; i++) {
            var tables = 0;
            var tables = $('.modula_container .MatrixTable[size="'+dividerArray[i]+'"]').length;
            var tds = 0;
            var tds = $('.modula_container .MatrixTable td[size="'+dividerArray[i]+'"]').length;
            var tds = tds - tables;
            var tot =  tds;
            var listItem = $('#divisor-section li.size'+dividerArray[i]);
            if (tot > 0){
                listItem.addClass('active');
            }
            listItem.find('.rightCol').text(tot);

            // var test = test + 'There are'+tot+'divisors - tables'+tables+' of length'+dividerArray[i]+'<br />';
            // $('#testDividers').html(test);            
        }        
    } else {
    }
}

function updatePartitions() {
    var partitions = $('.modula_container .MatrixTable').length;
    var listItem = $('#partition-section li').not('.headers');
    // alert(partitions);
    if (partitions > 0) {
        listItem.find('.rightCol').html(partitions);
        listItem.addClass('active');
    } else {
        listItem.find('.rightcol').html('0');
        listItem.removeClass('active');
    }
}
// /aggiorna campionario

//per la traslazione orizzontale usiamo colResizable
function moveDividerHor(e){
    $(".MatrixTable").colResizable({
        liveDrag: true,
        draggingClass:"dragging",
        minWidth: minCelWidth,
        disable: e,
        onDrag: function(e){
            var table = $(e.currentTarget);
            sizePartitions(table);
            sizeDividers('all');
        }
    });
}

//per quella verticale usiamo invece Resizable di jqueryUi
function moveDividerVer(e){
    $(".MatrixTable").resizable({
        grid: divisorStep,
        handles: 's',
        minHeight: divisorMin,
        maxHeight: divisorMax,
        disabled: e,
        stop: function() {
           getTraySize();
           sizePartitions(this);
           updateDividers('all');
        }
    });
}

//traslazione orizzontale globale DISATTIVATA PER ORA
// function moveTable(){
//     $(".modula_container").resizable({
//         grid: 40,
//         minWidth: 400,
//         maxWidth: 800,
//         handles: 'e'
//     });
// }

//drag righe    
function moveRow(e){
    $(".modula_container").sortable({
        axis: "y",
        cursor: "move",
        tolerance: "pointer",
        items: ".sortable",
        disabled: e,
        stop: function(){
            sizeDividers('all');
        }
    });
}

function enableDragging(){
    $(".enableDrag").addClass("active");
    moveRow(false);
    moveDividerHor(true);
    moveDividerVer(true);
    $(".modula_container button").not('.enableDrag').hide('slow');
    $(".modula_container td").addClass('dragActive');
}

function disableDragging(){
    $(".enableDrag").removeClass("active");
    moveRow(true);
    moveDividerHor(false);
    moveDividerVer(false);
    $(".modula_container button").not('enableDrag').show('slow');
    $(".modula_container td").removeClass('dragActive');
}

function switchView() {
    $('.viewSelect li').click(function(){
        if ( $(this).hasClass('active') ) {
            // do nothing
        } else {
            sizeDividers('all');
            draw3d(numRighe, altezzaRighe, colonne);
            var id = $(this).attr('target');
            $(this).siblings('li').removeClass('active');
            $('.viewPanel').hide();
            $('#'+id).show();
            $(this).addClass('active');
            //disabilitiamo gli slider in vista 3d
            if ($('#view-2d').css('display') == 'none') {
                $('#slider-height').attr('disabled', 'disabled');
                $('#slider-width').attr('disabled', 'disabled');
                $('#slider-length').attr('disabled', 'disabled');
            } else {
                $('#slider-height').removeAttr('disabled');
                $('#slider-width').removeAttr('disabled');
                $('#slider-length').removeAttr('disabled');
            }

        }
    });
}

function sizesliders() {
    var width = $('#slider-width'), winput = $('#trayWidth');
    var length = $('#slider-length'), linput = $('#trayLength');
    var height = $('#slider-height'), hinput = $('#trayHeight');

    width.noUiSlider({
        start: 654,
        behaviour: 'tap',
        step: 203,
        range: {
            'min': [ 654 ],
            //'50%': [ 654 ],
            'max': [ 857 ]
        },
        format: wNumb({
            decimals: 0,
            //postfix: 'mm',
        })
        });
        width.Link('lower').to(winput);
        width.on({
            set: function(){
                var w = winput.val();
                $('#wLabel').text(w);
                $('.modula_container').width(w);
                $('.traySection').width(w);
                getTraySize();
                draw3d(numRighe, altezzaRighe, colonne);
            }
        });

    length.noUiSlider({
        start: 400,
        behaviour: 'tap',
        step: 400,
        range: {
             'min': [ 400 ],
            'max': [ 8000 ]
        },
        format: wNumb({
            decimals: 0,
            //postfix: 'mm',
        })
        });
        length.Link('lower').to(linput);
        length.on({
            set: function(){
            var l = linput.val();
            $('#lLabel').text(l);
            $('.modula_container').height(l);
            getTraySize();
            draw3d(numRighe, altezzaRighe, colonne);
        }
        });

    height.noUiSlider({
        start: 45,
        behaviour: 'tap',
        step: 25,
        range: {
             'min': [ 45 ],
            'max': [ 245 ]
        },
        format: wNumb({
            decimals: 0,
            //postfix: 'mm',
        })
        });
        height.Link('lower').to(hinput);
        height.on({
            set: function(){
            var h = hinput.val();
            $('#hLabel').text(h);
            $('.traySection').height(h);
            getTraySize();
            draw3d(numRighe, altezzaRighe, colonne);
        }
        });

}


            
$(document).ready(function() {
    moveDividerHor(false);
    moveDividerVer(false);
    // moveTable(); DISATTIVATA PER ORA
    moveRow(true); //dragging disabilitato di default
    getTraySize();
    sizePartitions('all');
    sizeDividers('all');
    updateDividers('all');
    updatePartitions();
    switchView();
    $('.accordion').accordion({
        active: false,
        collapsible: true
    });
    sizesliders();
    $('#'+firstSidebar).show();
    $('#menu-'+firstSidebar).addClass('open');
    $('#view-'+defaultView).show();
});
