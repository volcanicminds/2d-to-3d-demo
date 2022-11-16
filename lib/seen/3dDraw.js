function draw3d(numRighe, altezzaRighe, colonne) {

	var context, drag, scene, shape = [], zoomer;

	var width = 800;	//coordinata orizzontale dell'origine
	var height = 500;	//coordinata verticale dell'origine

	var model = seen.Models["default"]();
			
	var L = $('.modula_container').width()/2;		//larghezza cassetto
	var W = $('.modula_container').height()/2;		//lunghezza cassetto
	var H = $('.traySection').height()/2;			//altezza cassetto

	var dHor = numRighe;			//n divisori orizzontali
	
	//dal vettore colonne (tutti gli spazi creati in 2D) ricaviamo i divisori verticali
	var divisori = colonne;
	var tempLength, tempLength2;
	for (var v=0; v<divisori.length; v++){
		if (divisori[v][1]===0){
			tempLength=divisori[v][2];
			divisori.splice(v,1);
			v--;
		} else {
			tempLength2=divisori[v][2];
			divisori[v][2]=tempLength;
			tempLength=tempLength+tempLength2;
		}
	}
	var dVer = divisori.length;
	
	//progressivo altezze dei divisori orizzontali (inizialmente c'è solo il primo)
	var totAltezze = [];
	totAltezze[0] = altezzaRighe[0];
	for (var x=1; x<altezzaRighe.length; x++){
		totAltezze[x]=totAltezze[x-1]+altezzaRighe[x];
	}

	//per il rettangolo esterno "alteriamo" un cubo
		shape[0] = seen.Shapes.cube().scale(L, H, W);
	//stessa cosa per i divisori orizzontali, ma con lunghezza fissa 1
	for (var k=1; k < 1+dHor; k++)
		shape[k] = seen.Shapes.cube().scale(L-1, H, 1);
	//e per quelli verticali, con larghezza 1
	for (var k2=dHor+1; k2 <= dHor+dVer; k2++){
		shape[k2] = seen.Shapes.cube().scale(1, H, (altezzaRighe[divisori[k2-dHor-1][0]]/2)-1);
	}


	//operazioni da fare per ogni shape
	for (var i=0; i < shape.length; i++){
		
		seen.Colors.randomSurfaces(shape[i]);

		//caratteristiche superficie
		for (var j=0; j < shape[i].surfaces.length; j++) {
			shape[i].surfaces[j].fillMaterial.color = seen.Colors.hex('#98C0EE');	//stesso colore per tutte le facce
			shape[i].surfaces[j].fillMaterial.specularExponent = 1;					//indice di rifrazione basso
			shape[i].surfaces[j].fillMaterial.color.a = 150;
			shape[i].surfaces[j].cullBackfaces = false;
			
			//i=0 è il rettangolo di base, j=3 è la faccia superiore da rendere trasparente
			if (i===0 && j==3) shape[i].surfaces[j].fillMaterial.color.a = 1;
		}

		//aggiunta degli shape al modello

		if (i===0)	//rettangolo di base
			model.add(shape[i]);

		else if (i>0 && i<=dHor)	//divisori verticali
			model.add(shape[i].translate(0, 0, -W+totAltezze[i-1]));

		else {
			model.add(shape[i].translate(
					-L+divisori[i-1-dHor][2],															//traslazione orizzontale
					0,																					//traslazione in altezza = 0
					-W+totAltezze[divisori[i-1-dHor][0]]-(altezzaRighe[divisori[i-1-dHor][0]]/2)		//traslazione verticale
				));
		}
	}

	//creazione scena
	scene = new seen.Scene({
		model: model,
		viewport: seen.Viewports.center(width, height)
	});
	
	scene.shader = seen.Shaders['diffuse']();
	
	scene.camera.scale(1/2);

	//render
	context = seen.Context('seen-canvas', scene);
	context.render();

	//rotazione
	drag = new seen.Drag('seen-canvas', {
		inertia: false
	});
	drag.on('drag.rotate', function(e) {
		var ref, xform;
		xform = (ref = seen.Quaternion).xyToTransform.apply(ref, e.offsetRelative);
		for (var i=0; i < shape.length; i++)
			shape[i].transform(xform);
		return context.render();
	});

	//mouse zoom
	zoomer = new seen.Zoom('seen-canvas', {
		smooth : false
	});
	zoomer.on('zoom.scale', function(e) {
		var xform;
		xform = seen.M().scale(e.zoom);
		for (var i=0; i < shape.length; i++)
			shape[i].transform(xform);
		return context.render();
	});

}