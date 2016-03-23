var shown_depth=4;
var height = $("#radial-draw-svg").height();
var width = $("#radial-draw-svg").width();
var standardWdith = width;
var margin_draw_svg = {top: 0, right: 5, bottom: 5, left: 5},
   	width = width - margin_draw_svg.left - margin_draw_svg.right,
    height = height - margin_draw_svg.top - margin_draw_svg.bottom;
var radialDrawOverflowHeight = $("#radial-draw-overflow").height();
var sortButtonHeight = radialDrawOverflowHeight * 0.03;
var svg = d3.select("#radial-draw-svg")
	.append("svg")
	.attr("id","radial")
	.attr("width", width)
	.attr("height", height)
	.attr("transform", "translate(" + margin_draw_svg.left + "," + margin_draw_svg.top + ")");
var sliderDivHeight = $("#slider-control-width").height();
var sliderDivWidth = $("#slider-control-width").width();
var sliderSvg = d3.select("#slider-control-width")
	.append("svg")
	.attr("id","slider-svg")
	.attr("width",sliderDivWidth)
	.attr("height",sliderDivHeight);
var heightSliderDivHeight = $("#slider-control-height").height();
var heightSliderDivWidth = $("#slider-control-height").width();
var heightSliderSvg = d3.select("#slider-control-height")
	.append("svg")
	.attr("id","height-slider-svg")
	.attr("width",heightSliderDivWidth)
	.attr("height",heightSliderDivHeight);
var setOperationWidth = $("#clientsDashboard").width() - margin_draw_svg.left - margin_draw_svg.right;
var setOperationHeight = $("#clientsDashboard").height();
var setOperationSvg = d3.select("#clientsDashboard")
	.append("svg")
	.attr("id", "set-operation-svg")
	.attr("width",setOperationWidth)
	.attr("height",setOperationHeight)
	.attr("transform", "translate(" + margin_draw_svg.left + "," + 0 + ")");
var cur_chosen_background_index="none";
//同时一共最多容纳5课树
var barcode_tree_num_max = 9;
//存储5个rect的信息
var background_rect_record=[];
//画每个barcode背后的rect
var mem_last_used_rect_index = 0;
var selectIdArray = [];
var includeArray = [];
var removeColor = "#d0d0d0";
var radialSvgName = "radial";
var setOperationSvgName = "set-operation-svg";
var setOperationNum = 2;
var beginRadians = Math.PI/2, endRadians = Math.PI * 3/2, points = 50;
var angle = d3.scale.linear().domain([0, points-1]).range([beginRadians, endRadians]);
var ISJUDGEAND = true, ISJUDGEOR = true, NOTJUDGEAND = false, NOTJUDGEOR = false, ISRESORT = true, NOTRESORT = false;
var MAXDEPTH = 5;
//画每个barcode背后的rect
//同时初始化记录这些rect的信息的background_rect_record
//barcode的tip
var radial = function(dataList){
		console.log(dataList);
		var barcodeNum = dataList.length;
		var rectAllHeight = 50;
		var originRectHeight = rectAllHeight / 7 * 6;
		var rectHeight = rectAllHeight / 7 * 6;
		var verticalInterval = rectAllHeight / 7;
		var rectY = 1;
		var originIndexX = 10;
		var indexWidth = 20;
		var indexBiasyX = 10;
		var originXCompute = originIndexX + indexWidth + indexBiasyX;
		var sawToothX = 20;
		var sawToothWidth = sawToothX;
		var maxBarNum = Math.floor((height - rectY * 2)/(rectHeight + verticalInterval));
		var widthArray = [20, 15, 10, 5, 2];
		var linearTreeArray = [];
		var unionLinearTree = [];
		var GlobalTreeDesArray = [];
		var FocusDesValue = "";
		var rowNum = 5;
		var repeat2Array = [];
		var loseBindData = [];
		//记录当前focus的子树的左右各有多少个节点
		var focusLeftRightObj = new Array();
		//全局变量定义点击事件所产生的是reduce还是focus
		var isReduce = true;
		//定义focus状态下的bar width的倍数
		var focusWidthMultipler = 2;
		//定义barcode svg的宽度
		var barcodeSvgWidth = 0;
		var buttonRepeatArray = [];
		var radialTip = d3.tip()
		  	.attr('class', 'd3-tip')
		 	.offset([-10, 0])
		  	.html(function(d) {
		    	return "Name:<span style='color:red'>" + d.name +"</span>" +
		    		 "Description:<span style='color:red'>" + d.description + "</span>" +
		    		 "Index:<span style='color:red'>" + d.linear_index + "</span>";
		  	});
		svg.call(radialTip);
		var patternTip = d3.tip()
		  	.attr('class', 'd3-tip')
		 	.offset([-10, 0])
		  	.html(function(d) {
		    	return "Name:<span style='color:red'>" + "</span>" +
		    		 "Description:<span style='color:red'>" + "</span>" +
		    		 "Index:<span style='color:red'>" + "</span>";
		  	});
		svg.call(patternTip);
		d3.selectAll(".triangle").remove();
		var union_root={//用树结构存储公共树
				//因为mark=0有特殊含义，所以输入的树的标号不能取0
				mark:0,//mark为0表示这个结点至少在两棵树中出现，mark不为0时，用于标记这个结点出现过的那棵树
				_depth:0,//结点所在的深度，在数据转换时d3的预处理函数已经用过depth了，所以这里要用_depth防止被覆盖
				name:"root",
				description:"root",
				//_children在下面自己会生成
				children:new Array(),//最底层结点没有children这个维度
				//size:...//只有最底层的结点有size：...
				//如果用sunburst的layout，上层的size会自己算出来，否则需要手动算才有
				_father: undefined
			};
		for(var i = 0; i < dataList.length; i++){
			//对于数据进行预先的处理
			var dataProcessor = dataCenter.datasets[i].processor;
			var dataset = dataProcessor.result;
			linearTreeArray[i] = [];
			var target_root={//用树结构存储公共树
				//因为mark=0有特殊含义，所以输入的树的标号不能取0
				mark:0,//mark为0表示这个结点至少在两棵树中出现，mark不为0时，用于标记这个结点出现过的那棵树
				_depth:0,//结点所在的深度，在数据转换时d3的预处理函数已经用过depth了，所以这里要用_depth防止被覆盖
				name:"root",
				description:"root",
				//_children在下面自己会生成
				children:new Array(),//最底层结点没有children这个维度
				//size:...//只有最底层的结点有size：...
				//如果用sunburst的layout，上层的size会自己算出来，否则需要手动算才有
				_father: undefined
			};
			//var curtreeindex = 1;
			var curtreeindex = 1+i;
			merge_preprocess_rawdata(dataset.dataList,target_root,curtreeindex,1);
			merge_preprocess_rawdata(dataset.dataList,union_root,curtreeindex,dataList.length);

			if (i==dataList.length-1)
			{
				if (union_root.trees_values.length!=curtreeindex+1)
					console.log("1error!!")
			}
			
			//reorder_tree(target_root);
			//cal_repeat_time(target_root);
			//cal_nth_different_subtree_traverse(target_root);
			//cal_repeat_group_size(target_root);

			//add_virtual_node(target_root);
			linearlize(target_root,linearTreeArray[i]);
			//根据处理得到的数据以及计算得到的坐标值进行实际的绘制
		}
		reorder_tree(union_root);
		cal_repeat_time(union_root);
		cal_nth_different_subtree_traverse(union_root);
		cal_repeat_group_size(union_root);
		add_virtual_node(union_root);
		linearlize(union_root,unionLinearTree);
		addTreesValuesNumber(unionLinearTree);
		addVirtualTreeValues(unionLinearTree);

		d3.selectAll('.index-rect').remove();
		d3.selectAll('.index-text').remove();

		console.log(unionLinearTree);
		for(var i = 0;i < unionLinearTree.length;i++){
			if(unionLinearTree[i].maximum_continuous_repeat_group_size != 1 && unionLinearTree[i].continuous_repeat_time == 1){
				loseBindData.push(unionLinearTree[i]);
			}
		}
		includeArray = [];
		for(var i = 0;i < dataList.length;i++){
			if(selectIdArray.indexOf(i)==-1){
				includeArray.push(i);
			}
		}
		draw_barcode(0, setOperationSvgName, includeArray, ISJUDGEAND, NOTJUDGEOR, 0, NOTRESORT);
		draw_barcode(1, setOperationSvgName, includeArray, NOTJUDGEAND, ISJUDGEOR, 1, NOTRESORT);
		console.log(dataList);
		for(var i = 0; i < dataList.length; i++){
			var Length = dataList.length - 1;
			draw_barcode(i, radialSvgName, [i], NOTJUDGEAND, NOTJUDGEOR, i, NOTRESORT);
		}
		//if(union_root.trees_values.length != curtreeindex+1)
		//	console.log("2error!!")
		//var selectionCheckArray = new Array();
		/*
		* @function: draw_barcode 绘制每一行的barcode
		* @parameter: index表示的是绘制的节点的位置 index的顺序是可以一直都是从小到大 然后表示的是从上到下的顺序(locationIndex)
		* 			  real_tree_index 表示的是实际绘制的树的标号 表示的是实际绘制的方面的问题
		*/
		function draw_barcode(index, svg_id, idArray, judgeAnd, judgeOr, real_tree_index, is_resort){
			radialSvgHeight = height;
			document.getElementById('radial-draw-svg').style.height = height + 'px';
			d3.select("#radial").attr("height", radialSvgHeight);	 
			if(document.getElementById('set-operation').checked){
				radialSvgHeight = height - 140;
				document.getElementById('radial-draw-svg').style.height = radialSvgHeight + 'px';
				d3.select("#radial").attr("height", radialSvgHeight);
			}
			maxBarNum = Math.floor((radialSvgHeight - rectY * 2)/(rectHeight + verticalInterval));
			barcodeSvgWidth = margin_draw_svg.left + margin_draw_svg.right * 2;
			//计算barcode svg的总宽度
			for(var i = 0; i < unionLinearTree.length; i++){
				var depth = unionLinearTree[i]._depth;
				if(depth != undefined){
					barcodeSvgWidth =  barcodeSvgWidth + widthArray[depth] + 2;
				}
			}
			barcodeSvgWidth = barcodeSvgWidth > standardWdith?barcodeSvgWidth: standardWdith;
			change_width(barcodeSvgWidth);
			var barcoded_tree_rectbackground_index = index;
			d3.selectAll('#' + svg_id)
				.selectAll('.sawtooth')
				.remove();
			if(svg_id == radialSvgName){
				var length = dataList.length>2?dataList.length:2;
				if(barcodeNum <= maxBarNum){
					for(var i = 0; i < length; i++){
						background_rect_record[i] = new Object();
						background_rect_record[i].y = rectY + (rectHeight + verticalInterval) * i;
						background_rect_record[i].height = rectHeight;
					}
				}else{
					rectAllHeight = (radialSvgHeight - rectY * 2)/dataList.length;
					rectHeight = rectAllHeight / 7 * 6;
					verticalInterval = rectAllHeight / 7;
					for(var i = 0; i < length; i++){
						background_rect_record[i] = new Object();
						background_rect_record[i].y = rectY + (rectHeight + verticalInterval) * i;
						background_rect_record[i].height = rectHeight;
					}
				}
			}else if(svg_id == setOperationSvgName){
				var length = dataList.length>2?dataList.length:2;
				rectHeight = originRectHeight;
				for(var i = 0; i < length; i++){
					background_rect_record[i] = new Object();
					background_rect_record[i].y = rectY + (rectHeight + verticalInterval) * i;
					background_rect_record[i].height = rectHeight;
				}
			}

			if($("#state-change").hasClass("active")){
				if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
					var originButtonNodeArray = get_reduce_attr();
					draw_reduce_button(originButtonNodeArray);
				}
			}else{
				if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
					var originButtonNodeArray = get_origin_attr();
					draw_button(originButtonNodeArray);
				}
			}
			function draw_reduce_button(originButtonNodeArray){
				document.getElementById('sort-button-div').innerHTML = "";
				var buttonContainer = document.getElementById('sort-button-div');
				var buttonHeight = $('#sort-button-div').height() - 3;
				var defaultDepth = 10;
				var beginX = 0;
				var formerEndX = 0;
				var beginNodeDepth = 0;
				var beginNodeMaxTime = 0;
				var endX = 0;
				var buttonWidth = 0;
				var repeatTime = 1;
				buttonRepeatArray = [];
				for(var i = 0;i < unionLinearTree.length;i++){
					var treeNode = unionLinearTree[i];
					var treeNodeIndex = treeNode.linear_index;
					if(treeNode.description == 'virtual' && treeNode.continuous_repeat_time == 1 
							&& treeNode._depth < defaultDepth){
						beginNodeDepth = treeNode._depth;
						beginNodeMaxTime = treeNode.maximum_continuous_repeat_group_size;
						beginX = originButtonNodeArray[treeNodeIndex].x;
						defaultDepth = treeNode._depth;
						buttonRepeatArray[repeatTime] = unionLinearTree[i].trees_values;
					}
					if(treeNode.continuous_repeat_time == beginNodeMaxTime && treeNode._depth == beginNodeDepth){
						endX = originButtonNodeArray[treeNodeIndex].x + originButtonNodeArray[treeNodeIndex].width;
						originButtonWidth = endX - beginX;
						defaultDepth = 10;
						if(originButtonWidth != 0){
							var sortButton = document.createElement('button');
							var marginLeft = (beginX - formerEndX);
							if(marginLeft == 9){
								marginLeft = 7;
							}
							var buttonId = "pattern-" + repeatTime;
							sortButton.className = "btn btn-default btn-xs pattern";
							sortButton.setAttribute("id",buttonId);
							sortButton.style.marginLeft = marginLeft + "px";
							sortButton.style.width = originButtonWidth + "px";
							sortButton.style.height = buttonHeight + "px";
							$(sortButton).attr('title', buttonId);
							sortButton.onclick = function(){
								var thisObject = $(this);
								if(thisObject.hasClass('pattern-active')){
									clickActive(thisObject);
								}else{
									console.log('----------------');
									clickNonActive(thisObject);
								}
							};
							$(sortButton).hover(function(){
								//patternTip.show(sortButton);
							},function(){
								//patternTip.hide(sortButton);
							})
							if(originButtonWidth < 15){
								sortButton.innerHTML = '';
							}else if(originButtonWidth < 30){
								sortButton.innerHTML = '.';
							}else if(originButtonWidth < 80){
								sortButton.innerHTML = repeatTime;
							}else{
								sortButton.innerHTML = "pattern " + repeatTime;
							}
							buttonContainer.appendChild(sortButton);
							if(unionLinearTree[treeNodeIndex].children != undefined){
								var childrenLength = unionLinearTree[treeNodeIndex].children.length;
								i = unionLinearTree[treeNodeIndex].children[childrenLength - 1].linear_index;
							}
							formerEndX = beginX + originButtonWidth;
							repeatTime = repeatTime + 1;
						}
					}
				}
			}
			function draw_button(originButtonNodeArray){
				document.getElementById('sort-button-div').innerHTML = "";
				var buttonContainer = document.getElementById('sort-button-div');
				var buttonHeight = $('#sort-button-div').height() - 3;
				var defaultDepth = 10;
				var beginX = 0;
				var formerEndX = 0;
				var beginNodeDepth = 0;
				var beginNodeMaxTime = 0;
				var endX = 0;
				var buttonWidth = 0;
				var repeatTime = 1;
				buttonRepeatArray = [];
				for(var i = 0;i < unionLinearTree.length;i++){
					var treeNode = unionLinearTree[i];
					var treeNodeIndex = treeNode.linear_index;
					if(treeNode.description == 'virtual' && treeNode.continuous_repeat_time == 1 
							&& treeNode._depth < defaultDepth){
						beginNodeDepth = treeNode._depth;
						beginNodeMaxTime = treeNode.maximum_continuous_repeat_group_size;
						beginX = originButtonNodeArray[treeNodeIndex].x;
						defaultDepth = treeNode._depth;
						buttonRepeatArray[repeatTime] = unionLinearTree[i].trees_values;
					}
					if(treeNode.continuous_repeat_time == beginNodeMaxTime && treeNode._depth == beginNodeDepth){
						endX = originButtonNodeArray[treeNodeIndex].x;
						originButtonWidth = (endX - beginX) / (beginNodeMaxTime - 2) * (beginNodeMaxTime - 1);
						if(originButtonWidth != 0){
								defaultDepth = 10;
								var sortButton = document.createElement('button');
								var buttonId = "pattern-" + repeatTime;
								sortButton.setAttribute("id",buttonId);
								sortButton.style.marginLeft = (beginX - formerEndX) + "px";
								sortButton.className = "btn btn-default btn-xs pattern";
								sortButton.style.width = originButtonWidth + "px";
								sortButton.style.height = buttonHeight + "px";
								$(sortButton).attr('title', buttonId);
							sortButton.onclick = function(){
								var thisObject = $(this);
								if(thisObject.hasClass('pattern-active')){
									clickActive(thisObject);
								}else{
									clickNonActive(thisObject);
								}
							};
							$(sortButton).hover(function(){
								console.log(sortButton);
								//patternTip.show(sortButton);
							},function(){
								//patternTip.hide(sortButton);
							});
							if(originButtonWidth < 15){
								sortButton.innerHTML = '';
							}else if(originButtonWidth < 30){
								sortButton.innerHTML = '.';
							}else if(originButtonWidth < 80){
								sortButton.innerHTML = repeatTime;
							}else{
								sortButton.innerHTML = "pattern " + repeatTime;
							}
							buttonContainer.appendChild(sortButton);
							if(unionLinearTree[treeNodeIndex].children != undefined){
								var childrenLength = unionLinearTree[treeNodeIndex].children.length;
								i = unionLinearTree[treeNodeIndex].children[childrenLength - 1].linear_index;
							}
							formerEndX = beginX + originButtonWidth;
							repeatTime = repeatTime + 1;
						}
					}
				}
			}
			function clickActive(this_object){
				$(".pattern").removeClass("pattern-active");
				this_object.removeClass("pattern-active")
				var thisID = $(this).attr('id');
				if(thisID == undefined){
					return;
				}
				var patternIdArray = $(this).attr('id').split('-');
				var patternId = patternIdArray[1];
				for(var i = 0; i < dataList.length; i++){
					var Length = dataList.length - 1;
					draw_barcode(i, radialSvgName, [i], NOTJUDGEAND, NOTJUDGEOR, Length - i, ISRESORT);
				}
			}
			function clickNonActive(this_object){
				$(".pattern").removeClass("pattern-active");
				this_object.addClass("pattern-active");
				var patternIdArray = this_object.attr('id').split('-');
				var patternId = +patternIdArray[1];
				var oneRepeatArray = buttonRepeatArray[patternId];
				console.log(oneRepeatArray);
				var processRepeatArray = [];
				for(var i = 1; i < oneRepeatArray.length; i++){
					processRepeatArray[i - 1] = new Object();
					processRepeatArray[i - 1].index = i - 1;
					processRepeatArray[i - 1].number = oneRepeatArray[i];
				}
				processRepeatArray.sort(function(a,b){
					var numA = a.number;
					var numB = b.number;
					return numA < numB;
				})
				console.log(processRepeatArray);
				for(var i = 0; i < dataList.length; i++){
					var Length = dataList.length - 1;
					draw_barcode(i, radialSvgName, [i], NOTJUDGEAND, NOTJUDGEOR, processRepeatArray[i].index, ISRESORT);
				}
			}
			document.getElementById('show-right').innerHTML = "";
			var container = document.getElementById('show-right');
			for(var i = 0;i < dataList.length;i++){
				var selectionCheck = document.createElement('input');
				selectionCheck.style.position = "absolute";
				selectionCheck.style.top = (sortButtonHeight + background_rect_record[i].y + background_rect_record[i].height/2) + "px";
				selectionCheck.style.left = "5px";
				selectionCheck.type = "checkbox";
				selectionCheck.name = "name" + i;
				selectionCheck.value = i;
				selectionCheck.id = "id" + i;
				selectionCheck.class = "selection";
				if(selectIdArray.indexOf(i) != -1){
					selectionCheck.checked = false;
				}else{
					selectionCheck.checked = true;
				}
				selectionCheck.addEventListener('click', function(){
					if(this.checked){
						//确定进行交并运算的树的集合，添加树
						var id = +this.value;
						selectIdArray.splice(selectIdArray.indexOf(id), 1);
					}else{
						//减少树
						var id = +this.value;
						selectIdArray.push(id);
					}
					includeArray = [];
					for(var i = 0;i < dataList.length;i++){
						if(selectIdArray.indexOf(i)==-1){
							includeArray.push(i);
						}
					}
					draw_barcode(0, setOperationSvgName, includeArray, ISJUDGEAND, NOTJUDGEOR, 0, NOTRESORT);
					draw_barcode(1, setOperationSvgName, includeArray, NOTJUDGEAND, ISJUDGEOR, 0, NOTRESORT);
				});
				container.appendChild(selectionCheck);
			}
			var reduceNodeArray = [];
			var tip_array = [];
			var originArray = [];
			for(var i = 0; i < widthArray.length; i++){
				originArray[i] = widthArray[i];
			}
			var barcoded_tree_biasy = background_rect_record[barcoded_tree_rectbackground_index].y;
			//var rectY = 10;
			//调整barcode的y坐标偏移，使得barcode始终处在rect的高度的中间
			//var rectY = (background_rect_record[0].height-rectHeight)/2;
			var Radial = {};
			ObserverManager.addListener(Radial);
			var handleColor = ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"];
			var treeIndex = dataCenter.datasets.length;
			var GlobalFormerDepth = 4;
			//var linear_tree = linearTreeArray[index];//用数组存储公共树
			var linear_tree = unionLinearTree;
			//注意：JS中函数参数传递不是按引用传的
			//函数内部如果直接给传入的对象赋值，效果是对内部的拷贝赋值；如果修改传入的对象的成员，那么修改能够影响到传入的对象
			var drawDepth = 0;
			for (var i = 0; i < MAXDEPTH; i++){
				var hasActive = $("#radial-depth-controller .level-btn[level=" + i + "]").hasClass("active");
				if(hasActive){
					drawDepth = i;
				}else if(!hasActive){
					break;
				}
			}
			console.log(drawDepth);
			if(drawDepth == (MAXDEPTH - 1)){
				console.log("----------------------");
				if($("#state-change").hasClass("active")){
					var originNodeArray = get_reduce_attr(index);
					draw_reduced_barcoded_tree(linear_tree, index, real_tree_index, originNodeArray);
					if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
						draw_reduce_button(originNodeArray);
					}
				}else{
					var originNodeArray = get_origin_attr(index);	
					console.log("----------------------");
					draw_barcoded_tree(linear_tree, index, real_tree_index, originNodeArray);
					if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
						draw_button(originNodeArray);
					}
				}
			}else{
				if($("#state-change").hasClass("active")){
					var originNodeArray = get_reduce_attr_depth(drawDepth, barcoded_tree_biasy, index);
					draw_reduced_barcoded_tree(linear_tree, index, real_tree_index, originNodeArray);
					if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
						draw_reduce_button(originNodeArray);
					}
				}else{
					var originNodeArray = get_origin_attr_depth(drawDepth, barcoded_tree_biasy, index);
					draw_barcoded_tree(linear_tree, index, real_tree_index, originNodeArray);
					if(svg_id == radialSvgName && index == (dataList.length - 1) && (!is_resort)){
						draw_button(originNodeArray);
					}
				}
			}
			GlobalFormerDepth = drawDepth;
			function change_width(width){
				width = width > standardWdith?width:standardWdith;
				document.getElementById('radial-draw-svg').style.width = width + 'px';
				d3.select("#radial").attr("width", width);
				document.getElementById('clientsDashboard').style.width = width + 'px';
				d3.select("#set-operation-svg").attr("width", width);
				document.getElementById('sort-button-div-container').style.width = (width + 10) + 'px';
				document.getElementById('sort-button-div').style.width = (width + 10) + 'px';
			}
			function get_origin_attr(index){
				var originNodeArray = new Array();
				var xCompute = originXCompute;
				var level = 0;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				for(var i = 0; i < linear_tree.length; i++){
					originNodeArray[i] = new Object();
					originNodeArray[i].x = xCompute;
					level = +linear_tree[i]._depth;
					if(linear_tree[i].description != 'virtual'){
						xCompute = xCompute + widthArray[level] + 2; 
						originNodeArray[i].width = widthArray[level];
					}else{
						originNodeArray[i].width = 0;
					}
				}
				change_width(xCompute + margin_draw_svg.right);
				return originNodeArray;
			}
			function get_virtual_attr(index){
				var newWidthArray = widthArray;//[40, 30, 20, 10, 5];
				var originNodeArray = new Array();
				var xCompute = originXCompute;
				var level = 0;
				var linear_tree = unionLinearTree;
				var defaultDepth = 10;
				for(var i = 0;i < linear_tree.length; i++){
					originNodeArray[i] = new Object();
					originNodeArray[i].x = xCompute;
					level = +linear_tree[i]._depth;
					if(linear_tree[i].description != 'virtual' && level < defaultDepth){
						xCompute = xCompute + newWidthArray[level] + 2;
						originNodeArray[i].width = newWidthArray[level];
						defaultDepth = level;
					}else if(linear_tree[i].description != 'virtual' && level > defaultDepth){
						originNodeArray[i].width = 0;
					}else if(linear_tree[i].description == 'virtual'){
						xCompute = xCompute + newWidthArray[level] + 2;
						originNodeArray[i].width = newWidthArray[level];
					}
				}
				change_width(xCompute + margin_draw_svg.right);
				return originNodeArray;
			}
			function get_table_attr(index){
				var originNodeArray = new Array();
				var xCompute = originXCompute;
				var level = 0;
				var linear_tree = unionLinearTree;
				for(var i = 0;i < linear_tree.length;i++){
					originNodeArray[i] = new Object();
					originNodeArray[i].x = xCompute;
					level = +linear_tree[i]._depth;
				}
			}
			function get_origin_attr_depth(max_depth, barcoded_tree_biasy, index){
				var originNodeArrayDepth = new Array();
				var xCompute = originXCompute;
				var maxDepth = max_depth;
				var level = 0;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				for(var i = 0; i < linear_tree.length; i++){
					originNodeArrayDepth[i] = new Object();
					originNodeArrayDepth[i].x = xCompute;
					level = + linear_tree[i]._depth;
					if(level <= max_depth && linear_tree[i].description != 'virtual'){
						xCompute = xCompute + widthArray[level] + 2;
						originNodeArrayDepth[i].width = widthArray[level];
					}else{
						originNodeArrayDepth[i].width = 0;
					}
					originNodeArrayDepth[i].height = rectHeight;
					originNodeArrayDepth[i].y = rectY + barcoded_tree_biasy
				}
				change_width(xCompute + margin_draw_svg.right);
				return originNodeArrayDepth;
			}
			function get_origin_attr_click(max_depth, origin_depth, treeDesArray, treeDesNow, barcoded_tree_biasy, index){
				var clickNodeArrayDepth = new Array();
				var xCompute = originXCompute;
				var maxDepth = max_depth;
				var level = 0;
				var originRoute = "";
				var compareRoute = "";
				var treeDesLength = treeDesNow.length;
				var isHide = false;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				for(var i = 0; i < linear_tree.length; i++){
					clickNodeArrayDepth[i] = new Object();
					clickNodeArrayDepth[i].x = xCompute;
					level = +linear_tree[i]._depth;
					originRoute = linear_tree[i].route;
					isHide = false;
					for(var j = 0; j < treeDesArray.length; j++){
						if(treeDesArray[j].treeDes != treeDesNow){
							compareRoute = originRoute.substring(0, treeDesArray[j].treeDes.length);
							if(compareRoute == treeDesArray[j].treeDes && originRoute != treeDesArray[j].treeDes && treeDesArray[j].treeIndex == index){
								isHide = true;
								break;
							}
						}
					}
					compareRoute = linear_tree[i].route.substring(0, treeDesLength);
					if(level <= origin_depth && linear_tree[i].description != 'virtual'){
						if((level > maxDepth && compareRoute == treeDesNow && originRoute != treeDesNow) || isHide){
							clickNodeArrayDepth[i].width = 0;
						}else{
							xCompute = xCompute + widthArray[level] + 2;
							clickNodeArrayDepth[i].width = widthArray[level];
						}
					}else{
						clickNodeArrayDepth[i].width = 0;
					}
					clickNodeArrayDepth[i].height = rectHeight;
					clickNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
				}
				change_width(xCompute + margin_draw_svg.right);
				return clickNodeArrayDepth;
			}
			function get_origin_attr_dblclick(focus_des_value, index){
				var resultArray = [];
				var focusNodeArray = new Array();
				var insertArray = new Array();
				var xCompute = originXCompute;
				var level = 0;
				var isFirst = false;
				for(var i = 0;i < linear_tree.length;i++){
					focusNodeArray[i] = new Object();
					focusNodeArray[i].x = xCompute;
					level = + linear_tree[i]._depth;
					var originRoute = linear_tree[i].route;
					var compareRoute = originRoute.substring(0, focus_des_value.length);
					var backCompareRoute = focus_des_value.substring(0, originRoute.length);
					if(compareRoute == focus_des_value || originRoute == backCompareRoute){
						isFirst = true;
						xCompute = xCompute + widthArray[level] * focusWidthMultipler + 2; 
						focusNodeArray[i].width = widthArray[level] * focusWidthMultipler;
					}else{
						if(isFirst){
							insertArray.push(xCompute);
							xCompute = xCompute + sawToothX;
						}
						focusNodeArray[i].width = 0;
						isFirst = false;
					}
				}
				change_width(xCompute + sawToothX * 2);
				resultArray[0] = focusNodeArray;
				resultArray[1] = insertArray;
				return resultArray;
			}
			//---------------------------------------------------------------------------------
			function get_reduce_attr(index){
				var reduceNodeArray = new Array();
				var xCompute = originXCompute;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				var compDepth = 10;
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArray[i] = new Object();
					//获取continuous_repeat_time和max_continuous_time
					repeatTime = linear_tree[i].continuous_repeat_time;
					maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
					//----------------------------------------------------------
					//获取当前遍历的节点的深度
					curDepth = linear_tree[i]._depth;
					//如果当前的节点的重复次数大于1，并且比当前纪录的缩略的节点更上层，你们就会更新当前纪录的节点，如果比记录的depth更深，那么width为0
					if(repeatTime > 1 && curDepth <= initReduceLevel){
						initReduceLevel = curDepth;
					}else if(repeatTime == 1 && curDepth == initReduceLevel){
						//每个节点只会控制它的字节点，所以遇到相同深度的节点，那么会恢复到原始的level
						initReduceLevel = 10;
					}else if(curDepth < initReduceLevel){
						initReduceLevel = initReduceLevel;
					}
					reduceNodeArray[i].x = xCompute;
					if(repeatTime == 1 && curDepth <= initReduceLevel){
						//repeatTime为1并且没有受到父亲节点的控制，那么高度为原始的height
						xCompute = xCompute + widthArray[curDepth] + 2;
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = rectHeight;
						reduceNodeArray[i].y = rectY + barcoded_tree_biasy;
					}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){

						if(repeatTime == maxRepeatTime){
							xCompute = xCompute + widthArray[curDepth] + 2;
						}
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
					}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
						xCompute = xCompute + widthArray[curDepth] + 2;
						reduceNodeArray[i].width = widthArray[curDepth];
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
					}else if(curDepth > initReduceLevel){
						reduceNodeArray[i].width = 0;
						reduceNodeArray[i].height = barHeight;
						reduceNodeArray[i].y = rectY + barcoded_tree_biasy;
					}
				}
				change_width(xCompute + margin_draw_svg.right);
				return reduceNodeArray;
			}
			function get_reduce_attr_depth(max_depth, barcoded_tree_biasy, index){
				var reduceNodeArrayDepth = new Array();
				var maxDepth = max_depth;
				var xCompute = originXCompute;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				var compDepth = 10;
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArrayDepth[i] = new Object();
					repeatTime = linear_tree[i].continuous_repeat_time;
					maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
					//----------------------------------------------------------
					curDepth = linear_tree[i]._depth;
					if(curDepth <= maxDepth){
						if(repeatTime > 1 && curDepth <= initReduceLevel){
							initReduceLevel = curDepth;
						}else if(repeatTime == 1 && curDepth == initReduceLevel){
							initReduceLevel = 10;
						}else if(curDepth < initReduceLevel){
							initReduceLevel = initReduceLevel;
						}
						reduceNodeArrayDepth[i].x = xCompute;
						if(repeatTime == 1 && curDepth <= initReduceLevel){
							xCompute = xCompute + widthArray[curDepth] + 2;
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = rectHeight;
							reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
						}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){
							if(repeatTime == maxRepeatTime){
								xCompute = xCompute + widthArray[curDepth] + 2;
							}
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
						}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
							xCompute = xCompute + widthArray[curDepth] + 2;
							reduceNodeArrayDepth[i].width = widthArray[curDepth];
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
						}else if(curDepth > initReduceLevel){
							reduceNodeArrayDepth[i].width = 0;
							reduceNodeArrayDepth[i].height = barHeight;
							reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
						}
					}else{
						reduceNodeArrayDepth[i].x = xCompute;
						reduceNodeArrayDepth[i].width = 0;
					}
				}
				change_width(xCompute + margin_draw_svg.right);
				return reduceNodeArrayDepth;
			}
			function get_reduce_attr_click(max_depth, origin_depth, treeDesArray, treeDesNow, barcoded_tree_biasy, index){
				var reduceNodeArrayDepth = new Array();
				var maxDepth = max_depth;
				var xCompute = originXCompute;
				var level = 0;
				var initReduceLevel = 10;
				var colNum = 5;
				var divideNum = colNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight / divideNum;
				var repeatTime = 0;
				var curDepth = 0;
				var maxRepeatTime = 0;
				var originRoute = "";
				var compareRoute = "";
				var treeDesLength = treeDesNow.length;
				var isHide = false;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				var compDepth = 10;
				for(var i = 0; i < linear_tree.length; i++){
					reduceNodeArrayDepth[i] = new Object();
					repeatTime = linear_tree[i].continuous_repeat_time;
					maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
					//----------------------------------------------------------
					reduceNodeArrayDepth[i].x = xCompute;
					level = +linear_tree[i]._depth;
					originRoute = linear_tree[i].route;
					isHide = false;
					for(var j = 0; j < treeDesArray.length; j++){
						if(treeDesArray[j].treeDes != treeDesNow){
							compareRoute = originRoute.substring(0, treeDesArray[j].treeDes.length);
							if(compareRoute == treeDesArray[j].treeDes && originRoute != treeDesArray[j].treeDes && treeDesArray[j].treeIndex == index){
								isHide = true;
								break;
							}
						}
					}
					compareRoute = linear_tree[i].route.substring(0, treeDesLength);
					if(level <= origin_depth){
						if((level > maxDepth && compareRoute == treeDesNow && originRoute != treeDesNow) || isHide){
							reduceNodeArrayDepth[i].width = 0;
						}else{
							//-----------------------------------
							repeatTime = linear_tree[i].continuous_repeat_time;
							maxRepeatTime = linear_tree[i].maximum_continuous_repeat_group_size;
							curDepth = linear_tree[i]._depth;
							if(repeatTime > 1 && curDepth <= initReduceLevel){
								initReduceLevel = curDepth;
							}else if(repeatTime == 1 && curDepth == initReduceLevel){
								initReduceLevel = 10;
							}else if(curDepth < initReduceLevel){
								initReduceLevel = initReduceLevel;
							}
							if(repeatTime == 1 && curDepth <= initReduceLevel){
								xCompute = xCompute + widthArray[curDepth] + 2;
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = rectHeight;
								reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
							}else if(repeatTime > 1 && (repeatTime - 1)%colNum != 0 && curDepth == initReduceLevel){
								if(repeatTime == maxRepeatTime){
									xCompute = xCompute + widthArray[curDepth] + 2;
								}
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
							}else if(repeatTime > 1 && (repeatTime - 1)%colNum == 0 && curDepth == initReduceLevel){
								xCompute = xCompute + widthArray[curDepth] + 2;
								reduceNodeArrayDepth[i].width = widthArray[curDepth];
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + (repeatTime - 2) % colNum * (barGap + barHeight) + barcoded_tree_biasy;
							}else if(curDepth > initReduceLevel){
								reduceNodeArrayDepth[i].width = 0;
								reduceNodeArrayDepth[i].height = barHeight;
								reduceNodeArrayDepth[i].y = rectY + barcoded_tree_biasy;
							}
							//-------------------------------------------
						}
					}else{
						reduceNodeArrayDepth[i].width = 0;
					}	
				}
				change_width(xCompute + margin_draw_svg.right);
				return reduceNodeArrayDepth;
			}
			draw_slide_bar();
			function draw_slide_bar(){
				function changePercentage(text){
					text = +text;
					var format_text = parseFloat(Math.round(text * 100) / 100).toFixed(1);
					d3.select("#now-text")
						.text(format_text);
				}
				clearPercentage();
				function clearPercentage(){
					d3.select("#now-text")
						.text(null);
				}
				var min = 0;
				var max = 25;
				var sliderWidth = sliderDivWidth * 6 / 10;
				var sliderHeight = sliderDivHeight * 2 / 10;
				sliderSvg.append("text")
					.attr("x", 9 * sliderDivWidth / 10)
					.attr("y", sliderDivHeight * 7 / 10)
					.attr('id', 'max-text')
					.text(max);

				sliderSvg.append("text")
					.attr("x", 0)
					.attr("y", sliderDivHeight * 7 / 10)
					.text("W:");

				sliderSvg.append("text")
					.attr("x", sliderDivWidth * 1.5 / 10)
					.attr("y", sliderDivHeight * 7 / 10)
					.attr("id", "now-text");

				sliderSvg.append("g")
					.attr("id","slider-g")
					.attr("transform","translate(" + sliderWidth * 4.5 / 10 + "," + sliderDivHeight * 4 / 10 + ")");
				var sliderHandleWidth = sliderWidth/60;
				var dragDis = 0;
				var finalValue = 0;
				var drag = d3.behavior.drag()
			        .on("drag", function(d,i) {
			        	var ox = originArray[i] / max * sliderWidth;
			            var dx = +d3.event.x - ox;
			            var dy = +d3.event.y;
			            if((d3.event.x > 0)&&(d3.event.x < sliderWidth - sliderHandleWidth)){
			            	d3.select(this).attr("transform", function(d,i){
				                return "translate(" + dx + "," + 0 + ")";
				            });
				            dx = +d3.event.x - ox;
				            dragDis = dx;			        
			            }
			            var value = dragDis / sliderWidth * max;
			        	finalValue = originArray[i] + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	changePercentage(finalValue);
			        })
			        .on("dragend",function(d,i){
			        	widthArray[i] = finalValue;
						for(var i = 0; i < dataList.length; i++){
			        		draw_barcode(i, radialSvgName, [i], false, false);
			        	}
						GlobalFormerDepth = shown_depth;
			        	changePercentage(finalValue);
			        });

			    sliderSvg.select("#back-slider").remove();
			    sliderSvg.select("#slider-g")
					.append("rect")
					.attr("id","back-slider")
					.attr("height",sliderHeight)
					.attr("width",sliderWidth)
					.attr("x",0)
					.attr("y",0)
					.attr("fill","gray");
				sliderSvg.selectAll(".slider").remove();
				sliderSvg.select("#slider-g")
					.selectAll(".slider")
					.data(widthArray)
					.enter()
					.append("rect")
					.attr("class","slider")
					.attr("id",function(d,i){
						return "slider-" + i;
					})
					.attr("x",function(d,i){
						var value = +d;
						return value / max * sliderWidth;
					})
					.attr("y",-sliderHeight/4)
					.attr("width",sliderHandleWidth)
					.attr("height",sliderHeight + sliderHeight/2)
					.attr("fill",function(d,i){
						return handleColor[i];
					})
					.on("mouseover",function(d,i){
						d3.select(this).classed("slider-hover-" + i,true);
						var changeClass = "hover-depth-" + i;
						d3.selectAll(".num-" + i).classed(changeClass,true);
						changePercentage(widthArray[i]);
					})
					.on("mouseout",function(d,i){
						var changeClass = "hover-depth-" + i;
						d3.select(this).classed("slider-hover-" + i,false);
						d3.selectAll(".num-" + i).classed(changeClass,false);
						clearPercentage();
					})
					.call(drag);
			}
			draw_height_slide_bar();
			function draw_height_slide_bar(){	
				function changePercentage(text){
					text = +text;
					var format_text = parseFloat(Math.round(text * 100) / 100).toFixed(1);
					heightSliderSvg.select("#height-now-text")
						.text(format_text);
				}
				clearPercentage();
				function clearPercentage(){
					heightSliderSvg.select("#height-now-text")
						.text(null);
				}
				var min = 0;
				var max = 2 * originRectHeight;
				var sliderWidth = heightSliderDivWidth * 6 / 10;
				var sliderHeight = heightSliderDivHeight * 2 / 10;
				heightSliderSvg.select("#height-max-text").remove();
				heightSliderSvg.append("text")
					.attr("x", 9 * sliderDivWidth / 10)
					.attr("y", sliderDivHeight * 7 / 10)
					.attr('id', 'height-max-text')
					.text(max);

				heightSliderSvg.append("text")
					.attr("x", 0)
					.attr("y", sliderDivHeight * 7 / 10)
					.text("H:");

				heightSliderSvg.append("text")
					.attr("x", sliderDivWidth * 1.2 / 10)
					.attr("y", sliderDivHeight * 7 / 10)
					.attr("id", "height-now-text");

				heightSliderSvg.append("g")
					.attr("id","slider-height-g")
					.attr("transform","translate(" + sliderWidth * 4.5 / 10 + "," + sliderDivHeight * 4 / 10 + ")");
				var sliderHandleWidth = sliderWidth / 60;
				var dragDis = 0;
				var finalValue = 0;
				var dragHeight = d3.behavior.drag()
			        .on("drag", function(d,i) {
			        	var ox = rectHeight / max * sliderWidth;
			            var dx = +d3.event.x - ox;
			            var dy = +d3.event.y;
			            if((d3.event.x > 0)&&(d3.event.x < sliderWidth - sliderHandleWidth)){
			            	d3.select(this).attr("transform", function(d,i){
				                return "translate(" + dx + "," + 0 + ")";
				            });
				            dx = +d3.event.x - ox;
				            dragDis = dx;			        
			            }
			            var value = dragDis / sliderWidth * max;
			        	finalValue = rectHeight + value;
			        	finalValue = finalValue > max ? max : finalValue;
			        	finalValue = finalValue < min ? min : finalValue;
			        	changePercentage(finalValue);
			        })
			        .on("dragend",function(d,i){
			        	rectHeight = finalValue;
						for(var i = 0; i < dataList.length; i++){
			        		draw_barcode(i, radialSvgName, [i], false, false);
			        	}
						GlobalFormerDepth = shown_depth;
			        	changePercentage(finalValue);
			        });
			    heightSliderSvg.select("#back-height-slider").remove();
			    heightSliderSvg.select("#slider-height-g")
					.append("rect")
					.attr("id","back-height-slider")
					.attr("height",sliderHeight)
					.attr("width",sliderWidth)
					.attr("x",0)
					.attr("y",0)
					.attr("fill","gray");
				heightSliderSvg.selectAll(".slider-height").remove();
				heightSliderSvg.select("#slider-height-g")
					.selectAll(".slider-height")
					.data([rectHeight])
					.enter()
					.append("rect")
					.attr("class","slider-height")
					.attr("id",function(d,i){
						return "slider-" + i;
					})
					.attr("x",function(d,i){
						var value = +d;
						return value / max * sliderWidth;
					})
					.attr("y",-sliderHeight/4)
					.attr("width",sliderHandleWidth)
					.attr("height",sliderHeight + sliderHeight/2)
					.attr("fill",function(d,i){
						return 'black';
					})
					.on("mouseover",function(d,i){
						d3.select(this).classed("slider-hover-height",true);
						changePercentage(rectHeight);
					})
					.on("mouseout",function(d,i){
						d3.select(this).classed("slider-hover-height",false);
						clearPercentage();
					})
					.call(dragHeight);
			}
			function draw_left_sawtooth_button(biasx,biasy,biasy_index)
			{
				var sawToothW = sawToothWidth * 0.6;
				var cur_button_shape=	"M" + sawToothW + "," + rectHeight * 0.4 +
										"L" + sawToothW * 0.8 + ","+ rectHeight * 0.4 + 
										"L" + sawToothW + "," + rectHeight * 0.2 +
										"L" + sawToothW * 0.8 + ","+ rectHeight * 0.2 +
										"L" + sawToothW + ","+ 0 +
										"L" + 0 + ","+ 0 +
										"L" + 0 + ","+ rectHeight +
										"L" + sawToothW * 0.8 + ","+ rectHeight +
										"L" + sawToothW + ","+ rectHeight * 0.8 +
										"L" + sawToothW * 0.8 + ","+ rectHeight * 0.8 +
										"L" + sawToothW + ","+ rectHeight * 0.6 +
										"L" + sawToothW * 0.8 + ","+ rectHeight * 0.6
				svg = d3.select('#'+svg_id);
				svg.append("path")	
					.attr('class', 'sawtooth')							 		
					.attr("d",cur_button_shape)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1)
					.attr("fill",function(d,i){  						
						return "white";  					
					})
					.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy + rectY) + ")";  
							})
					.on("mouseover",function(d,i){
						d3.selectAll('.sawtooth')
						.attr('fill','lightblue');
					})
					.on("click",function(d,i){
						for(var j = 0;j < dataList.length;j++){
							animation_dblclick_recover(j);
						}
					})
					.on("mouseout",function(){
						d3.selectAll('.sawtooth')
						.attr('fill','white');
					})
			}
			//draw_left_sawtooth_button的(biasx,biasy)右上角坐标
			function draw_right_sawtooth_button(biasx,biasy,biasy_index)
			{
				var sawToothW = sawToothWidth * 0.6;
				var cur_button_shape=	"M" + -sawToothW + "," + rectHeight * 0.4 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.4 + 
										"L" + -sawToothW + "," + rectHeight * 0.2 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.2 +
										"L" + -sawToothW + ","+ 0 +
										"L" + 0 + ","+ 0 +
										"L" + 0 + ","+ rectHeight +
										"L" + -sawToothW * 0.8 + ","+ rectHeight +
										"L" + -sawToothW + ","+ rectHeight * 0.8 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.8 +
										"L" + -sawToothW + ","+ rectHeight * 0.6 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.6
				svg = d3.select('#' + svg_id);
				svg.append("path")	
					.attr('class','sawtooth')							 		
					.attr("d",cur_button_shape)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1).attr("fill",function(d,i){  						
						return "white";  					
					})
					.attr("transform",function(d,i){  
						return "translate(" + (biasx) + "," + (biasy + rectY) + ")";  
					})
					.on("mouseover",function(d,i){
						d3.selectAll('.sawtooth')
						.attr('fill','lightblue');
					})
					.on("click",function(d,i){
						for(var j = 0;j < dataList.length;j++){
							animation_dblclick_recover(j);
						}
					})
					.on("mouseout",function(){
						d3.selectAll('.sawtooth')
						.attr('fill','white');
					})
			}
			function draw_double_sawtooth_button(biasx, biasy,biasy_index)
			{
				var sawToothW = sawToothWidth * 0.6;
				var cur_button_shape_top = "M" + -sawToothW + "," + rectHeight * 0.4 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.4 + 
										"L" + -sawToothW + "," + rectHeight * 0.2 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.2 +
										"L" + -sawToothW + ","+ 0 +
										"L" + 0 + ","+ 0 +
										"L" + -sawToothW * 0.2 + ","+ rectHeight * 0.2 +
										"L" + 0 + ","+ rectHeight * 0.2 +
										"L" + -sawToothW * 0.2 + ","+ rectHeight * 0.4 +
										"L" + 0 + ","+ rectHeight * 0.4;
				var cur_button_shape_bottom = "M" + -sawToothW + "," + rectHeight * 0.6 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.6 + 
										"L" + -sawToothW + "," + rectHeight * 0.8 +
										"L" + -sawToothW * 0.8 + ","+ rectHeight * 0.8 +
										"L" + -sawToothW + ","+ rectHeight +
										"L" + 0 + ","+ rectHeight +
										"L" + -sawToothW * 0.2 + ","+ rectHeight * 0.8 +
										"L" + 0 + ","+ rectHeight * 0.8 +
										"L" + -sawToothW * 0.2 + ","+ rectHeight * 0.6 +
										"L" + 0 + ","+ rectHeight * 0.6;
				svg = d3.select('#' + svg_id);
				svg.append("g")
					.attr("id", "double-saw-tooth")
					.append("path")	
					.attr('class','sawtooth-top sawtooth')							 		
					.attr("d",cur_button_shape_top)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1).attr("fill",function(d,i){  						
						return "white";  					
					})
					.attr("transform",function(d,i){  
						return "translate(" + (biasx + sawToothWidth * 0.8) + "," + (biasy + rectY) + ")";  
					})
					.on("mouseover",function(d,i){
						d3.selectAll('.sawtooth')
						.attr('fill','lightblue');
					})
					.on("click",function(d,i){
						for(var j = 0;j < dataList.length;j++){
							animation_dblclick_recover(j);
						}
					})
					.on("mouseout",function(){
						d3.selectAll('.sawtooth')
						.attr('fill','white');
					})

				d3.select("#double-saw-tooth")
					.append("path")	
					.attr('class','sawtooth-bottom sawtooth')							 		
					.attr("d",cur_button_shape_bottom)								 		
					.attr("stroke","black")								 		
					.attr("stroke-width",1).attr("fill",function(d,i){  						
						return "white";  					
					})
					.attr("transform",function(d,i){  
						return "translate(" + (biasx + sawToothWidth * 0.8) + "," + (biasy + rectY) + ")";  
					})
					.on("mouseover",function(d,i){
						d3.selectAll('.sawtooth')
						.attr('fill','lightblue');
					})
					.on("click",function(d,i){
						for(var j = 0;j < dataList.length;j++){
							animation_dblclick_recover(j);
						}
					})
					.on("mouseout",function(){
						d3.selectAll('.sawtooth')
						.attr('fill','white');
					});									
			}
			var changeWidthArray = [];
			for(var i = 0;i < widthArray.length;i++){
				changeWidthArray[i] = widthArray[i];
			}
			//----------------------------------------------------------------------------------
			var maintain_tooltip_display=[];
			//-----------------------------------------------------------------------------
			function animation_click_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow, biasy_index,svg_id){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = unionLinearTree;
				var beforeArrayDepth = get_origin_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_origin_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);

				var svg = d3.select("#" + svg_id);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayClick[i].x;
					})
					.call(endall, function(){
						draw_button(nowArrayClick);
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							var desObject = new Object();
							desObject.treeDes = treeDesNow;
							desObject.treeIndex = index;
							desObject.svgId = svg_id;
							GlobalTreeDesArray.push(desObject);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k], index);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_click_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数				
				var beforeArrayClick = get_origin_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_origin_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);

				var svg = d3.select("#" + svg_id);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayClick[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayClick[i].width;
					})
					.call(endall, function(){
						draw_button(nowArrayClick);
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							GlobalTreeDesArray.splice(get_index(GlobalTreeDesArray,treeDesNow),1);
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k], index);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_click_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_reduce_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;

				var beforeArrayDepth = get_reduce_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_reduce_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var svg = d3.select("#" + svg_id);

				svg.selectAll('.repeat-time-' + barcoded_tree_rectbackground_index).style('opacity',0);
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayClick[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayClick[i].x;
					})
					.call(endall, function(){
						draw_reduce_button(nowArrayClick);
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							var desObject = new Object();
							desObject.treeDes = treeDesNow;
							desObject.treeIndex = index;
							desObject.svgId = svg_id;
							GlobalTreeDesArray.push(desObject);
							//-------change the location of the lose node---------
							//add_lose_repeat(index);
							//---------------------set opacity--------------------
							svg.selectAll('.repeat-time-' + index)
							.style('opacity',function(d,i){
								var routeClass = d3.select(this).attr('class');
								var routeClassArray = routeClass.split(" ");
								var route = routeClassArray[routeClassArray.length - 1];
								var compareRoute = "";
								if(treeDesNow!=undefined){
									compareRoute = route.substring(0, treeDesNow.length);
									if(compareRoute == treeDesNow){
										return 0;
									}
								}
								if(treeDesArray!=undefined){
									for(var j = 0;j < treeDesArray.length;j++){
										var treeDesTemp = treeDesArray[j].treeDes;
										compareRoute = route.substring(0, treeDesTemp.length);
										if(compareRoute == treeDesTemp && treeDesArray[j].treeIndex == index){
											return 0;
										}
									}
								}
								return 1;
							});
							//--------------------------------------------------
							svg.selectAll(".triangle").remove();
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k], index);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_click_reduce_shrink(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_click_reduce_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数
				var svg = d3.select("#" + svg_id);

				var beforeArrayDepth = get_reduce_attr_click(before_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				var nowArrayClick = get_reduce_attr_click(now_depth, origin_depth, treeDesArray, treeDesNow, biasy, index);
				svg.selectAll('.repeat-time-' + barcoded_tree_rectbackground_index).style('opacity',0);
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayClick[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayDepth[i].width;
				})
				.call(endall,function(d,i){
					draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_show(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayClick[i].width;
					})
					.call(endall, function(){
						draw_reduce_button(nowArrayClick);
						//svg.selectAll('.repeat-time-1').style('opacity', 1);
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							GlobalTreeDesArray.splice(get_index(GlobalTreeDesArray,treeDesNow),1);
							svg.selectAll(".triangle").remove();
							//-------change the location of the lose node---------
							//add_lose_repeat(index);
							//---------------------set opacity--------------------
							svg.selectAll('.repeat-time-' + index)
							.style('opacity',function(d,i){
								var routeClass = d3.select(this).attr('class');
								var routeClassArray = routeClass.split(" ");
								var route = routeClassArray[routeClassArray.length - 1];
								var compareRoute = "";
								if(treeDesNow!=undefined){
									compareRoute = route.substring(0, treeDesNow.length);
									if(compareRoute == treeDesNow){
										return 1;
									}
								}
								if(treeDesArray!=undefined){
									for(var j = 0;j < treeDesArray.length;j++){
										var treeDesTemp = treeDesArray[j].treeDes;
										compareRoute = route.substring(0, treeDesTemp.length);
										if(compareRoute == treeDesTemp && treeDesArray[j].treeIndex == index){
											return 0;
										}
									}
								}
								return 1;
							});
							for(var k = 0; k < GlobalTreeDesArray.length; k++){
								draw_adjust_button(GlobalTreeDesArray[k], index);
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_click_reduce_stretch(now_depth,before_depth,origin_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_unreduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				//按下换depth的button时，要把原来的tip全都删光
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var beforeArrayDepth = get_origin_attr_depth(before_depth, biasy, index);
				var nowArrayDepth = get_origin_attr_depth(now_depth, biasy, index);

				var svg = d3.select("#" + svg_id);
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()//过渡动画
				.duration(400)
				.attr('x',function(d,i){
					return beforeArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowArrayDepth[i].width;
				})
				.call(endall, function() { 
					draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('x',function(d,i){
						return nowArrayDepth[i].x;
					})
					//call 相当于定义一个函数，再把选择的元素给它
					.call(endall, function(){
						draw_button(nowArrayDepth);
						now_depth = +now_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							if(treeDesNow!=undefined){
								var desObject = new Object();
								desObject.treeDes = treeDesNow;
								desObject.treeIndex = index;
								desObject.svgId = svg_id;
								GlobalTreeDesArray.push(desObject);
								svg.selectAll(".triangle").remove();
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k], index);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_unreduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//-----------------------------------------------------------------------------------------
			function animation_unreduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var svg = d3.select("#" + svg_id);
				var beforeArrayDepth = get_origin_attr_depth(before_depth, biasy, index);
				var nowArrayDepth = get_origin_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return nowArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return beforeArrayDepth[i].width;
				})
				.call(endall, function() {
					draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow); 
				});
				//----------------------------------------------------------
				function draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					xCompute = originXCompute;
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('width',function(d,i){
						return nowArrayDepth[i].width;
					})
					.call(endall, function() { 
						draw_button(nowArrayDepth);
						now_depth = +now_depth;
						before_depth = +before_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							if(treeDesNow!=undefined){
								GlobalTreeDesArray.splice(get_index(GlobalTreeDesArray,treeDesNow),1);
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k], index);
								}					
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_unreduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}			
			//---------------------------------------------------------------------------
			function animation_reduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数
				var svg = d3.select("#" + svg_id);
				var beforeReduceArrayDepth = get_reduce_attr_depth(before_depth, biasy, index);
				var nowReduceArrayDepth = get_reduce_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()//过渡动画
				.duration(600)
				.attr('x',function(d,i){	
					return beforeReduceArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return nowReduceArrayDepth[i].width;
				})
				.call(endall, function() { 
					draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow);
				});
				function draw_depth_move(now_depth,before_depth,target_depth,treeDesArray,treeDesNow){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('x',function(d,i){
						return nowReduceArrayDepth[i].x;
					})
					.call(endall, function(){
						draw_reduce_button(nowReduceArrayDepth);
						now_depth = +now_depth;
						before_depth = +before_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							if(treeDesNow != undefined){
								var desObject = new Object();
								desObject.treeDes = treeDesNow;
								desObject.treeIndex = index;
								desObject.svgId = svg_id;
								GlobalTreeDesArray.push(desObject);
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k], index);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth - 1;
							animation_reduced_barcoded_tree_depthchange_shrink(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//---------------------------------------------------------------------------
			function animation_reduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数
				var svg = d3.select("#" + svg_id);
				var beforeReduceArrayDepth = get_reduce_attr_depth(before_depth, biasy, index);
				var nowReduceArrayDepth = get_reduce_attr_depth(now_depth, biasy, index);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(600)
				.attr('x',function(d,i){
					return nowReduceArrayDepth[i].x;
				})
				.attr('width',function(d,i){
					return beforeReduceArrayDepth[i].width;
				})
				.call(endall, function() {
				 	draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index); 
				});
				//----------------------------------------------------------
				function draw_depth_show(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('width',function(d,i){
						return nowReduceArrayDepth[i].width;
					})
					.call(endall, function() { 
						draw_reduce_button(nowReduceArrayDepth);
						now_depth = +now_depth;
						before_depth = +before_depth;
						target_depth = +target_depth;
						if(now_depth == target_depth){
							//draw_link(biasy,index);
							if(treeDesNow != undefined){
								GlobalTreeDesArray.splice(get_index(GlobalTreeDesArray,treeDesNow),1);
								svg.selectAll(".triangle").remove();	
								for(var k = 0; k < GlobalTreeDesArray.length; k++){
									draw_adjust_button(GlobalTreeDesArray[k], index);
								}
							}
						}else{
							before_depth = now_depth;
							now_depth = now_depth + 1;
							animation_reduced_barcoded_tree_depthchange_stretch(now_depth,before_depth,target_depth,treeDesArray,treeDesNow,biasy_index,svg_id);
						}
					});
				}
			}
			//---------------------------------------------------------------------------
			function animation_reduced2unreduced(shown_depth, biasy_index, svg_name){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数
				var svg = d3.select("#" + svg_name);

				svg.selectAll('.repeat-time-' + index).style('opacity', 0);
				var targetReduceArray = get_origin_attr_depth(shown_depth, biasy, index);

				//svg.selectAll('.repeat-time-1').style('opacity',0);
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(2500)
				.attr('x',function(d,i){
					return targetReduceArray[i].x;
				})
				.attr('width',function(d,i){
					return targetReduceArray[i].width;
				})
				.call(endall, function() {
				 	animation_change_y(); 
				});
				function animation_change_y(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('y',function(d,i){
						return targetReduceArray[i].y;
					})
					.call(endall, function() {
					 	animation_change_height(); 
					});
				}
				function animation_change_height(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('height',function(d,i){
						return targetReduceArray[i].height;
					})
					.call(endall, function() {
						draw_button(targetReduceArray);
					 	//draw_link(biasy,index);
					});
				}
			}
			//-----------------------------------------------------------------------------
			function animation_unreduced2reduced(shown_depth, biasy_index, svg_name){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				//按下换depth的button时，要把原来的tip全都删光
				//for (var i=0;i<linear_tree.length;++i)
				//	tip_array[i].hide();//hide可以不传参数

				var targetUnreduceArray = get_reduce_attr_depth(shown_depth, biasy, index);
				var svg = d3.select("#" + svg_name);

				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(600)
				.attr('height',function(d,i){
					return targetUnreduceArray[i].height;
				})
				.call(endall, function() {
				 	animation_change_y(); 
				});
				function animation_change_y(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(600)
					.attr('y',function(d,i){
						return targetUnreduceArray[i].y;
					})
					.call(endall, function() {
					 	animation_change_x(); 
					});
				}
				function animation_change_x(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(2500)
					.attr('x',function(d,i){
						return targetUnreduceArray[i].x;
					})
					.attr('width',function(d,i){
						return targetUnreduceArray[i].width;
					})
					.call(endall, function() {
					 	//draw_link(biasy,index);
					 	draw_reduce_button(targetUnreduceArray);
					 	svg.selectAll('.repeat-time-' + index).style('opacity', 1);
					});
				}
			}
			//------------------------------------------------------------------------------
			function animation_dblclick_reduce_focus(focus_des_value, biasy_index){
			}
			//-------------------------------------------------------------------------------
			function animation_dblclick_focus(focus_des_value, biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = unionLinearTree;
				var resultArray = get_origin_attr_dblclick(focus_des_value);
				var focusNodeArray = resultArray[0];
				var insertArray = resultArray[1];
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('width',function(d,i){
					return focusNodeArray[i].width;
				})
				.call(endall,function(d,i){
					draw_focus_move();
				});
				function draw_focus_move(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('x',function(d,i){
						return focusNodeArray[i].x;
					})
					.call(endall,function(d,i){
						//draw_left_sawtooth_button(originXCompute, biasy);
						//只有在右边存在节点被缩略才会绘制出右锯齿
						if(focusNodeArray[focusNodeArray.length - 1].width == 0){
							draw_right_sawtooth_button(focusNodeArray[focusNodeArray.length - 1].x, biasy, index);
						}
						if(insertArray.length > 1){
							for(var j = 0; j < (insertArray.length - 1); j++){
								draw_double_sawtooth_button(insertArray[j], biasy, index);
							}
						}else{
							draw_double_sawtooth_button(insertArray[0], biasy, index);
						}
						//draw_link(biasy,index);
					});
				}
			}
			//-------------------------------------------------------------------------------
			function animation_dblclick_recover(biasy_index){
				var index = biasy_index;
				var biasy = background_rect_record[index].y;
				var linear_tree = unionLinearTree;
				var recoverNodeArray = get_origin_attr(index);
				svg.selectAll(".sawtooth").remove();
				svg.selectAll('.bar-class-' + index)
				.data(linear_tree)
				.transition()
				.duration(400)
				.attr('x',function(d,i){
					return recoverNodeArray[i].x;
				})
				.call(endall,function(d,i){
					draw_focus_show();
				});
				function draw_focus_show(){
					svg.selectAll('.bar-class-' + index)
					.data(linear_tree)
					.transition()
					.duration(400)
					.attr('width',function(d,i){
						return recoverNodeArray[i].width;
					})
					.call(endall,function(d,i){
						//draw_link(biasy,index);
					});
				}
			}
			//-------------------------------------------------------------------------------
			function endall(transition, callback) { 
			    if (transition.size() === 0) { callback() }
			    var n = 0; 
			    transition
			        .each(function() { ++n; }) 
			        .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
			}
			function draw_link(barcoded_tree_biasy,index){
				var svg = d3.select("#" + svg_id);
				var depth = 4;
				//var linear_tree = linearTreeArray[index];
				var linear_tree = unionLinearTree;
				svg.selectAll('.arc_background_index-' + index).remove();
				var beginRadians = Math.PI/2,
					endRadians = Math.PI * 3/2,
					points = 50;
				for(var i = 0;i < linear_tree.length;i++){
					var fatherWidth =  +svg//.selectAll(".rect_background_index-"+barcoded_tree_rectbackground_index)
											.select('#bar-id' + i + 
													'rect_background_index-' + index)
											.attr('width');
					var fatherX = +svg.select('#bar-id' + i + 
												'rect_background_index-' + index)
										.attr('x') + fatherWidth/2;
					var thisNode = linear_tree[i];
					var fatherIndex = thisNode.linear_index;
					var children = thisNode.children;
					if(children != undefined){
						for(var j = 0;j < children.length;j++){
							var child = children[j];
							if(thisNode._depth <= depth){
								var childIndex = child.linear_index;
								var childWidth = +svg.select('#bar-id' + childIndex + 
															'rect_background_index-' + index)
														.attr('width');
								var childX = +svg.select('#bar-id' + childIndex + 
															'rect_background_index-' + index)
													.attr('x') + childWidth/2;
								var radius = (childX - fatherX)/2;
								var angle = d3.scale.linear()
							   		.domain([0, points-1])
							   		.range([beginRadians, endRadians]);
							   	var line = d3.svg.line.radial()
							   		.interpolate("basis")
							   		.tension(0)
							   		.radius(radius)
							   		.angle(function(d, i) { return angle(i); });
							   	var rectLink =	"M" + (-radius) + "," + 0 +
										"L" + (-radius)  + "," + rectHeight + 
										"L" + (radius) + "," + rectHeight +
										"L" + (radius) + "," + 0;
							   	if(childWidth != 0){
							   		svg.append("path")
							   		.d(rectLink)
									.attr("class", "line " + "bg-" + index + "f-" + fatherIndex 
					    							+ " bg-" + index + "c-" + childIndex 
													+ " arc_background_index-" + index
													+ " class_end"
					    				)
					    			.attr('id','path-f' + fatherIndex +'-c-'+ childIndex)
					    			.attr("d", line)
					    			.attr("transform", "translate(" + (fatherX + radius) + ", " + (barcoded_tree_biasy + rectY + rectHeight) + ")");
							   	}	
							}
						}
					}
				}
			}
			var g;
			//---------------------------------------------------------------------------
			//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
			function draw_barcoded_tree(linear_tree,cur_tree_index,real_tree_index,origin_node_array)
			{
				var svg = d3.select('#' + svg_id); 
				var originNodeArray = origin_node_array;
				draw_index(real_tree_index,cur_tree_index);
				repeat2Array = [];
				xCompute = originXCompute;//用于累积当前方块的横坐标
				var acc_depth_node_num=[];//记录各个深度的结点数
				for (var i=0;i<=4;++i){
					acc_depth_node_num[i]=0;
				}
				//先画条码
				for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
				{
					acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
				}

				var selection = svg.selectAll(".rect_background_index-" + barcoded_tree_rectbackground_index)
				.data(linear_tree);

				selection.enter()
				.append('rect')
				.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return  'bar-class' + 
							' bar-id' + d.linear_index +
							' bar-class-' + barcoded_tree_rectbackground_index + 
						    ' num-' + d._depth + 'father-' + fatherIndex + "bg-" + barcoded_tree_rectbackground_index + 
							" num-" + d._depth +
							' father-' + fatherIndex + 
							" father-" + fatherIndex + "subtree-" + d.nth_different_subtree +
							" rect_background_index-" + barcoded_tree_rectbackground_index +
							" class_end" + 
							" " + d.route + "-bg-" + barcoded_tree_rectbackground_index +
							" " + svg_id;
				})
				.attr('id',function(d,i){
					var id = 'bar-id' + d.linear_index + "rect_background_index-" + barcoded_tree_rectbackground_index;
					var barId = 'bar-id' + d.linear_index;
					//将continuous_repeat_time为2的节点存储下来，在存储的节点的基础上面append rect
					if(d.continuous_repeat_time == 2){
						if(repeat2Array.indexOf(barId) == -1){
							repeat2Array.push(barId);
						}
					}
					return id;
				})
				.attr('x',function(d,i){
					return originNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return rectY + barcoded_tree_biasy;
				})
				.attr('width',function(d,i){
					return originNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return rectHeight;
				})
				.attr('fill',function(d,i){
					return fillHandler(d,i,real_tree_index);
				})
				.on('mouseover',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoverHandler(d,i,cur_tree_index);
					if(d3.select(this).classed(radialSvgName)){
						var treeId = dataList[barcoded_tree_rectbackground_index].id;
						ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length, d._depth, treeId]);
					}
				})
				.on('mouseout',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoutHandler(d, i);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				    	ObserverManager.post("percentage", [0 ,-1, treeId]);
				    }
				})
				.on('click',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					var id = d3.select(this).attr('id');
					clickHandlerOrigin(d, i ,id);
				});
				//--------------------------------
				selection.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return  'bar-class' + 
							' bar-id' + d.linear_index +
							' bar-class-' + barcoded_tree_rectbackground_index + 
						    ' num-' + d._depth + 'father-' + fatherIndex + "bg-" + barcoded_tree_rectbackground_index + 
							" num-" + d._depth +
							' father-' + fatherIndex + 
							" father-" + fatherIndex + "subtree-" + d.nth_different_subtree +
							" rect_background_index-" + barcoded_tree_rectbackground_index +
							" class_end" + 
							" " + d.route + "-bg-" + barcoded_tree_rectbackground_index + 
							" " + svg_id;
				})
				.attr('id',function(d,i){
					var id = 'bar-id' + d.linear_index + "rect_background_index-" + barcoded_tree_rectbackground_index;
					var barId = 'bar-id' + d.linear_index;
					//将continuous_repeat_time为2的节点存储下来，在存储的节点的基础上面append rect
					if(d.continuous_repeat_time == 2){
						if(repeat2Array.indexOf(barId) == -1){
							repeat2Array.push(barId);
						}
					}
					return id;
				})
				.attr('x',function(d,i){
					return originNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return rectY + barcoded_tree_biasy;
				})
				.attr('width',function(d,i){
					return originNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return rectHeight;
				})
				.attr('fill',function(d,i){
					return fillHandler(d,i,real_tree_index);
				})
				.on('mouseover',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoverHandler(d,i,svg_id,cur_tree_index);
					if(d3.select(this).classed(radialSvgName)){
						var treeId = dataList[barcoded_tree_rectbackground_index].id;
						ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length, d._depth, treeId]);
					}	
				})
				.on('mouseout',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoutHandler(d,i,svg_id);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				   		ObserverManager.post("percentage", [0 ,-1, treeId]);
				    }
				    return radialTip.hide;
				})
				.on('click',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					var id = d3.select(this).attr('id');
					clickHandlerOrigin(d, i ,id);
				});
				selection.exit().remove();
				//draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			}
			//---------------------------------------------------------------------------
			//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
			function draw_reduced_barcoded_tree(linear_tree,cur_tree_index,real_tree_index, reduce_node_array)
			{
				reduceNodeArray = reduce_node_array;
				var isShow = true;
				var nowDepth = -1;
				draw_index(real_tree_index, cur_tree_index);
				var svg = d3.select('#' + svg_id); 
				var divideNum = rowNum * 3 - 1;
				var barHeight = rectHeight / divideNum * 2;
				var barGap = rectHeight/divideNum;
				var barWidth = 10;
				var curDrawDep = 10;
				var formerNodeRepeat = 0;
				var formerDepth = 0;
				xCompute = originXCompute;//用于累积当前方块的横坐标
				var acc_depth_node_num=[];//记录各个深度的结点数
				for (var i=0;i<=4;++i){
					acc_depth_node_num[i]=0;
				}
				for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
				{
					acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
				}
				var selection = svg.selectAll(".rect_background_index-"+barcoded_tree_rectbackground_index)
				.data(linear_tree);
				//----------------------------
				selection.enter()
				.append('rect')
				.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return 'bar-class' +
						   ' bar-id' + d.linear_index +
						   ' bar-class-' + barcoded_tree_rectbackground_index + 
						   ' num-' + d._depth + 'father-' + fatherIndex + 'bg-' + barcoded_tree_rectbackground_index +
						   " num-" + d._depth + 
						   ' father-' + fatherIndex + 
						   " father-" + fatherIndex + "subtree-" + d.nth_different_subtree  + 
						   " rect_background_index-" + barcoded_tree_rectbackground_index + 
						   " class_end" + 
						   " " + d.route + "-bg-" + barcoded_tree_rectbackground_index + 
						   " " + svg_id;
				})
				.attr('id',function(d,i){
					var id = 'bar-id' + d.linear_index + "rect_background_index-" + barcoded_tree_rectbackground_index;
					//将continuous_repeat_time为2的节点存储下来，在存储的节点的基础上面append rect
					var barId = 'bar-id' + d.linear_index;
					if(d.continuous_repeat_time == 2){
						if(repeat2Array.indexOf(barId) == -1){
							repeat2Array.push(barId);
						}
					}
					return id;
				})
				.attr('x',function(d,i){
					return reduceNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return reduceNodeArray[i].y;
				})
				.attr('width',function(d,i){
					return reduceNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return reduceNodeArray[i].height;
				})
				.attr('fill',function(d,i){
					return fillHandler(d,i,real_tree_index);
				})
				.on('mouseover',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoverReduceHandler(d, i, svg_id, cur_tree_index);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				    	ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length, d._depth, treeId]);
				    }
				})
				.on('mouseout',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoutReduceHandler(d,i, svg_id);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				    	ObserverManager.post("percentage", [0 ,-1, treeId]);
				    }
				})
				.on('click',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					//click一下转换hide或保持的状态
					var id = d3.select(this).attr('id');
					clickHandlerReduce(d, i, id);
				});
				//----------------------------------
				selection.attr('class',function(d,i){
					var fatherIndex = -1;
					if(d._father!=undefined){
						fatherIndex = d._father.linear_index;
					}
					return 'bar-class' +
						   ' bar-id' + d.linear_index +
						   ' bar-class-' + barcoded_tree_rectbackground_index + 
						   ' num-' + d._depth + 'father-' + fatherIndex + 'bg-' + barcoded_tree_rectbackground_index +
						   " num-" + d._depth + 
						   ' father-' + fatherIndex + 
						   " father-" + fatherIndex + "subtree-" + d.nth_different_subtree  + 
						   " rect_background_index-" + barcoded_tree_rectbackground_index + 
						   " class_end" + 
						   " " + d.route + "-bg-" + barcoded_tree_rectbackground_index;
				})
				.attr('id',function(d,i){
					var id = 'bar-id' + d.linear_index + "rect_background_index-" + barcoded_tree_rectbackground_index;
					//将continuous_repeat_time为2的节点存储下来，在存储的节点的基础上面append rect
					var barId = 'bar-id' + d.linear_index;
					if(d.continuous_repeat_time == 2){
						if(repeat2Array.indexOf(barId) == -1){
							repeat2Array.push(barId);
						}
					}
					return id;
				})
				.attr('x',function(d,i){
					return reduceNodeArray[i].x;
				})
				.attr('y',function(d,i){
					return reduceNodeArray[i].y;
				})
				.attr('width',function(d,i){
					return reduceNodeArray[i].width;
				})
				.attr('height',function(d,i){
					return reduceNodeArray[i].height;
				})
				.attr('fill',function(d,i){
					return fillHandler(d,i,real_tree_index);
				})
				.on('mouseover',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoverReduceHandler(d,i,svg_id,cur_tree_index);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				    	ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length, d._depth, treeId]);
				    }
				    return radialTip.show;
				})
				.on('mouseout',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					mouseoutReduceHandler(d,i);
				    if(d3.select(this).classed(radialSvgName)){
				    	var treeId = dataList[barcoded_tree_rectbackground_index].id;
				    	ObserverManager.post("percentage", [0 ,-1, treeId]);
				    }
				    return radialTip.hide;
				})
				.on('click',function(d,i){
					if(d3.select(this).attr("fill") == removeColor){
						return;
					}
					//click一下转换hide或保持的状态
					var id = d3.select(this).attr('id');
					clickHandlerReduce(d, i, id);
				});
				//---------------------------------
				selection.exit().remove();
				//add_lose_repeat(barcoded_tree_rectbackground_index);
				//draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			}
			/*
			* @function: drawIndex绘制barcode tree 前面的index rect以及index
			* @parameter: null
			*/
			function draw_index(real_tree_index, cur_tree_index){
				var svg = d3.select('#' + svg_id); 
				var indexRectBeginY = rectY + barcoded_tree_biasy;
				var indexTextX1 = originIndexX + indexWidth / 4; //+ indexWidth * 3 / 8;
				var indexTextX2 = originIndexX + indexWidth / 16; //+ indexWidth * 3 / 16;
				var indexTextOr = originIndexX + indexWidth / 8;
				var indexTextY = indexRectBeginY + rectHeight * 5 / 8;
				svg.append('rect')
					.attr('class', 'index-rect')
					.attr('x',originIndexX)
					.attr('y', indexRectBeginY)
					.attr('width',indexWidth)
					.attr('height',rectHeight)
					.on('mouseover',function(d,i){
						d3.select(this).classed('this-highlight',true);
					})
					.on('mouseout',function(d,i){
						d3.select(this).classed('this-highlight',false);
					});
				var indexText = 0;
				if(svg_id == setOperationSvgName){
					switch(cur_tree_index){
						case 0:
							indexText = 'AND';	
							svg.append('text')
								.attr('class', 'index-text')
								.attr('x',originIndexX)
								.attr('y',indexTextY)
								.text(indexText)
								.style('font-size','10px');
						break;
						case 1:
							indexText = 'OR';
							svg.append('text')
								.attr('class','index-text')
								.attr('x',indexTextOr)
								.attr('y',indexTextY)
								.text(indexText)
								.style('font-size','10px');
						break;
					}
				}else if(svg_id == radialSvgName){
					console.log(real_tree_index);
					indexText = dataList[real_tree_index].id;
					if(indexText < 10){
						svg.append('text')
							.attr('class', 'index-text')
							.attr('x',indexTextX1)
							.attr('y',indexTextY)
							.text(indexText)
							.style('font-size','15px');
					}else{
						svg.append('text')
							.attr('class', 'index-text')
							.attr('x',indexTextX2)
							.attr('y',indexTextY)
							.text(indexText)
							.style('font-size','15px');
					}
				}
			}
			/*
			* @function: fillHandler判断bar的颜色的函数(对于reduce模式与origin模式是相同的)
			* @parameter: d,i,cur_tree_index d3原始的参数以及当前绘制的树的index值
			*/
			function fillHandler(d,i,cur_tree_index){
				if(judgeAnd){
					// 对于虚拟节点
					if(d.description == 'virtual'){
						var sendArray = [];
						for(var j = 0;j < idArray.length;j++){
							sendArray.push(d.trees_values_array[idArray[j] + 1]);
						}
						if(hasAndValue(sendArray)){
							return "black";
						}
						return removeColor;
					}
					// 对于实际存在的节点
					for(var j = 0;j < idArray.length;j++){
						if(d.trees_values[idArray[j] + 1] == 'none'){
							return removeColor;
						}
					}
					return "black";
				}else if(judgeOr){
					// 对于虚拟节点
					if(d.description == 'virtual'){
						var sendArray = [];
						for(var j = 0;j < idArray.length;j++){
							sendArray.push(d.trees_values_array[idArray[j] + 1]);
						}
						if(hasOrValue(sendArray)){
							return "black";
						}
						return removeColor;
					}
					// 对于实际存在的节点
					for(var j = 0;j < idArray.length;j++){
						if(d.trees_values[idArray[j] + 1] != 'none'){
							return "black";
						}
					}
					return removeColor;
				}else{
					if(d.description == 'virtual' && d.trees_values[cur_tree_index + 1] != 0){
						return 'black';
					}else if(d.description == 'virtual' && d.trees_values[cur_tree_index + 1] == 0){
						return removeColor;
					}
					if(d.trees_values[cur_tree_index + 1] == 'none'){
						return removeColor;
					}else{
						return "black";
					}
				}
			}
			/*
			* @function: hasAndValue判断在传入的数组中是否存在所有的数组中都存在的节点
			* @parameter: sendArray中的元素是所有的存在该模式的index值
			*/
			function hasAndValue(send_array){
				var getArray0 = send_array[0];
				var sendArray = send_array;
				for(var i = 0;i < getArray0.length; i++){
					var value = getArray0[i];
					var hasThis = true;
					for(var j = 0;j < sendArray.length; j++){
						if(sendArray[j].indexOf(value) == -1){
							hasThis = false;
							break;
						}
					}
					if(hasThis){return true;}
				}
				return false;
			}
			/*
			* @function: hasOrValue判断在传入的数组是否都是空节点，如果都是空节点，那么返回false，否则返回true
			* @parameter: sned_array中的元素是所有存在该模式的index值
			*/
			function hasOrValue(send_array){
				var sendArray = send_array;
				for(var i = 0;i < sendArray.length; i++){
					if(sendArray[i].length != 0){
						return true;
					}
				}
				return false;
			}
			/*
			* @function: clickHandlerReduce判断缩略状态下点击的响应事件(reduce模式)
			* @parameter: d, i, id d3原始的参数以及click node的id
			*/
			function clickHandlerReduce(d,i,id){
				d3.selectAll(".triangle").remove();
			 	var idArray = id.split('-');
				var biasy_index = +idArray[2];
				var routeIndex = -1;
				for(var i = 0;i < GlobalTreeDesArray.length;i++){
					if(GlobalTreeDesArray[i].treeDes == d.route && GlobalTreeDesArray[i].treeIndex == barcoded_tree_rectbackground_index){
						routeIndex = i;
						break;
					}
				}
				var add = true;
				if(!($('#switch-button').bootstrapSwitch("state"))){
					if(routeIndex == -1){
						if($("#state-change").hasClass("active")){
							for(var i = 0;i < dataList.length;i++){
								animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,radialSvgName);
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}else{
							for(var i = 0;i < dataList.length;i++){
								animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,radialSvgName);
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}
					}else{
						if($("#state-change").hasClass("active")){
							for(var i = 0;i < dataList.length;i++){
								animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,radialSvgName);
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}else{
							for(var i = 0;i < dataList.length;i++){
								animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,radialSvgName);
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}	
					}
				}
				/*else{
					console.log('---------------------------------');
					d3.selectAll('.triangle-' + biasy_index).remove();
					if(FocusDesValue != 'router'){
						if($("#state-change").hasClass("active")){
							var focusNodeArray = get_reduce_attr();
							for(var i = 0;i < dataList.length;i++){
								animation_dblclick_reduce_focus(FocusDesValue, i, focusNodeArray);//biasy_index
							}
						}else{
							var focusNodeArray = get_origin_attr();
							for(var i = 0;i < dataList.length;i++){
								animation_dblclick_focus(FocusDesValue, i, focusNodeArray);//biasy_index
							}
						}
					}
				}*/
				//draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			 }
			/* 
			* @function: clickHandlerOrigin判断原始的barcode状态下点击的响应事件(origin模式)
			* @parameter: d, i, id表示的是d3原始的参数以及click node的id
			*/
			function clickHandlerOrigin(d,i,id){
				d3.selectAll(".triangle").remove();
				var idArray = id.split('-');
				var biasy_index = +idArray[2];
				FocusDesValue = d.route;
				var routeIndex = -1;
				for(var i = 0;i < GlobalTreeDesArray.length;i++){
					if(GlobalTreeDesArray[i].treeDes == d.route && GlobalTreeDesArray[i].treeIndex == barcoded_tree_rectbackground_index){
						routeIndex = i;
						break;
					}
				}
				var add = true;
				console.log('clickHandler');
				if(!($('#switch-button').bootstrapSwitch("state"))){
					if(routeIndex == -1){
						if($("#state-change").hasClass("active")){
							for(var i = 0;i < dataList.length;i++){
								animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,radialSvgName);//biasy_index
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_reduce_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}else{
							for(var i = 0;i < dataList.length;i++){
								animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,radialSvgName);//biasy_index
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_shrink(GlobalFormerDepth,GlobalFormerDepth,GlobalFormerDepth,d._depth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}
					}else{
						if($("#state-change").hasClass("active")){
							for(var i = 0;i < dataList.length;i++){
								animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,radialSvgName);//biasy_index
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_reduce_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}else{
							for(var i = 0;i < dataList.length;i++){
								animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,radialSvgName);//biasy_index
							}
							for(var i = 0;i < setOperationNum;i++){
								animation_click_stretch(d._depth,d._depth,GlobalFormerDepth,GlobalFormerDepth,GlobalTreeDesArray,d.route,i,setOperationSvgName);
							}
						}
					}
				}else{
					d3.selectAll('.triangle-' + biasy_index).remove();
					if(FocusDesValue != 'router'){
						if($("#state-change").hasClass("active")){
							var focusNodeArray = get_reduce_attr();
							for(var i = 0;i < dataList.length;i++){
								animation_dblclick_reduce_focus(FocusDesValue, i, focusNodeArray);//biasy_index
							}
						}else{
							var focusNodeArray = get_origin_attr();
							for(var i = 0;i < dataList.length;i++){
								animation_dblclick_focus(FocusDesValue, i, focusNodeArray);//biasy_index
							}
						}
					}
				}
				//draw_link(barcoded_tree_biasy,barcoded_tree_rectbackground_index);
			}
			/*
			* @function: mouseoverhandler 鼠标hover的响应事件(origin模式)
			* @parameter: d,i d3原始的参数 
			*/
			function mouseoverHandler(d,i,svg_id,cur_tree_index){
				radialTip.show(d);
				var svg = d3.select("#" + svg_id);
				var fatherIndex = -1;
				var linkHeight = rectHeight/2;
				var thisIndex = d.linear_index;
				var bgRectInfo = background_rect_record[cur_tree_index];
				if (document.getElementById("highlight_self").checked){
					d3.selectAll('.bar-id' + thisIndex).classed("this-highlight",true);
				}
				var thisWidth = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("width");
				var thisX = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("x") + thisWidth / 2;
				var thisY = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("y");
				var thisHeight = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("height");
				if(d._father!=undefined){
					fatherIndex = d._father.linear_index;
					father = d._father;
					sibling_group=father.children;
					if (document.getElementById("highlight_sibling").checked)
					{
						for (var j=0;j<sibling_group.length;++j)
						{
							var cur_sibling=sibling_group[j];
							var siblingId=cur_sibling.linear_index;
							svg.selectAll('#bar-id' + siblingId + "rect_background_index-" + barcoded_tree_rectbackground_index)
									.classed("sibiling-highlight",true);
						}
					}
				}
				//-------------highlight parent node-----------------
				var fatherId = 0;
				if(d._father!=undefined){
					fatherId = d._father.linear_index;
				}else{
					fatherId = -1;
				}
				if (document.getElementById("highlight_father").checked && fatherId != -1)
				{
					svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("father-highlight",true);
					var fatherWidth = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("width");
					var fatherX = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("x") + fatherWidth / 2;
					var fatherY = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("y");
					var fatherHeight = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("height");
					var radius = (thisX - fatherX)/2;
					var line = d3.svg.line.radial()
						.interpolate("basis")
						.tension(0)
						.radius(radius)
						.angle(function(d, i) { return angle(i); });
					var rectLink =	"M" + (-radius) + "," + 0 +
						"L" + (-radius)  + "," + linkHeight + 
						"L" + (radius) + "," + linkHeight +
						"L" + (radius) + "," + 0;
					if(thisWidth != 0 && fatherWidth != 0){
			   			svg.append("path")
					   	.datum(d3.range(points))
						.attr("class", "line " + "bg-" + barcoded_tree_rectbackground_index + "f-" + fatherId 
			    				+ " bg-" + barcoded_tree_rectbackground_index + "c-" + thisIndex 
								+ " arc_background_index-" + barcoded_tree_rectbackground_index
								+ " class_end"
			    		)
			    		.attr('id','path-f' + fatherId +'-c-'+ thisIndex)
			    		.attr("d", rectLink)
			    		.attr("transform", "translate(" + (fatherX + radius) + ", " + 
			    					(fatherY + fatherHeight) + ")");
					}
				}
				var children = [];
				if(d.children!=undefined){
					children = d.children;
				}
				if (document.getElementById("highlight_children").checked)
				{
					for(var i = 0;i < children.length;i++){
						var childId = children[i].linear_index;
						var isExist = svg.select('#bar-id' + childId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
							.attr("fill") != removeColor;
						if(isExist){
							svg.select('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.classed("children-highlight",true);
							var childWidth = +svg.select('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.attr("width");
							var childX = +svg.select('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.attr("x") + childWidth / 2;
							var radius = (childX - thisX) / 2;
							var line = d3.svg.line.radial()
								.interpolate("basis")
								.tension(0)
								.radius(radius)
								.angle(function(d, i) { return angle(i); });
							var rectLink =	"M" + (-radius) + "," + 0 +
								"L" + (-radius)  + "," + linkHeight + 
								"L" + (radius) + "," + linkHeight +
								"L" + (radius) + "," + 0;
							if(thisWidth != 0 && childWidth != 0){
								svg.append("path")
							   	.datum(d3.range(points))
								.attr("class", "line " + "bg-" + barcoded_tree_rectbackground_index + "f-" + thisIndex 
					    				+ " bg-" + barcoded_tree_rectbackground_index + "c-" + childId 
										+ " arc_background_index-" + barcoded_tree_rectbackground_index
										+ " class_end"
					    		)
					    		.attr('id','path-f' + fatherId +'-c-'+ thisIndex)
					    		.attr("d", rectLink)
					    		.attr("transform", "translate(" + (thisX + radius) + ", " + 
					    					(thisY + thisHeight) + ")");
							}
						}
					}		
				}		
			   if(d._father!=undefined){
					svg.selectAll(".father-" + d._father.linear_index +
								  "subtree-" + d.nth_different_subtree + 
								  "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("same-sibling",true);
				} 				
			}
			/*
			* @function: mouseoutHandler 鼠标hover离开的响应事件(origin模式)
			* @parameter: d,i d3原始的参数
			*/
			function mouseoutHandler(d,i,svg_id){
				radialTip.hide(d);
				var thisIndex = d.linear_index;
				if (document.getElementById("highlight_self").checked){
					d3.selectAll('.bar-id' + thisIndex).classed("this-highlight",true);
				}
				d3.selectAll(".line").remove();
				d3.selectAll('.bar-class')
				.classed("sibiling-highlight",false);

				d3.selectAll('.bar-class')
				.classed("father-highlight",false);

				d3.selectAll('.bar-class')
				.classed("children-highlight",false);

				d3.selectAll('.bar-class')
				.classed("this-highlight",false);

				d3.selectAll('path')
				.classed('children-highlight',false);

				d3.selectAll('path')
				.classed('path-highlight',false);

			   	d3.selectAll('path')
				.classed('father-highlight',false);
				if(d._father!=undefined){
					d3.selectAll(".father-" + d._father.linear_index + 
								  "subtree-" + d.nth_different_subtree + 
								  "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("same-sibling",false);
				}
			}
			/*
			* @function: mouseoverReduceHandler 鼠标hover的响应事件(reduce模式)
			* @parameter: d, i d3的原始的参数
			*/
			function mouseoverReduceHandler(d,i,svg_id,cur_tree_index){
				var svg = d3.select("#" + svg_id);
				radialTip.show(d);
				var fatherIndex = -1;
				var thisIndex = d.linear_index;
				var linkHeight = rectHeight/2;
				var bgRectInfo = background_rect_record[cur_tree_index];
				if (document.getElementById("highlight_self").checked){
					d3.selectAll('.bar-id' + thisIndex).classed("this-highlight",true);
				}
				var thisWidth = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("width");
				var thisX = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("x") + thisWidth / 2;
				var thisY = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("y");
				var thisHeight = +svg.select('#bar-id' + thisIndex + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("height");
				if(d._father!=undefined){
					/*fatherIndex = d._father.linear_index;
					svg.selectAll('.num-' + d._depth + 'father-' + fatherIndex + 'bg-' + barcoded_tree_rectbackground_index)
					.classed("sibiling-highlight",true);*/
					father = d._father;
					sibling_group=father.children;
					if (document.getElementById("highlight_sibling").checked && sibling_group != undefined)
					{
						for (var j=0;j<sibling_group.length;++j)
						{
							var cur_sibling=sibling_group[j];
							var siblingId=cur_sibling.linear_index;
							svg.selectAll('#bar-id' + siblingId + "rect_background_index-" + barcoded_tree_rectbackground_index)
									.classed("sibiling-highlight",true);
						}
					}
				}
				// 高亮父亲节点
				var fatherId = 0;
				if(d._father!=undefined){
					fatherId = d._father.linear_index;
				}else{
					fatherId = -1;
				}
				if (document.getElementById("highlight_father").checked && fatherId != -1)
				{
					svg.selectAll('#bar-id' + fatherId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.classed("father-highlight",true);
					var fatherWidth = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("width");
					var fatherX = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("x") + fatherWidth / 2;
					var fatherHeight = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("height");
					var fatherY = +svg.select('#bar-id' + fatherId + "rect_background_index-" + barcoded_tree_rectbackground_index)
						.attr("y");
					var radius = (thisX - fatherX)/2;
					var line = d3.svg.line.radial()
						.interpolate("basis")
						.tension(0)
						.radius(radius)
						.angle(function(d, i) { return angle(i); });
					var rectLink =	"M" + (-radius) + "," + 0 +
						"L" + (-radius)  + "," + linkHeight + 
						"L" + (radius) + "," + linkHeight +
						"L" + (radius) + "," + 0;
					if(thisWidth != 0 && fatherWidth != 0){
			   			svg.append("path")
					   	.datum(d3.range(points))
						.attr("class", "line " + "bg-" + barcoded_tree_rectbackground_index + "f-" + fatherId 
			    				+ " bg-" + barcoded_tree_rectbackground_index + "c-" + thisIndex 
								+ " arc_background_index-" + barcoded_tree_rectbackground_index
								+ " class_end"
			    		)
			    		.attr('id','path-f' + fatherId +'-c-'+ thisIndex)
			    		.attr("d", rectLink)
			    		.attr("transform", "translate(" + (fatherX + radius) + ", " + 
			    					(fatherHeight + fatherY) + ")");
					}
				}
				var children = [];
				if(d.children!=undefined){
					children = d.children;
				}
				if (document.getElementById("highlight_children").checked)
				{
					for(var i = 0;i < children.length;i++){
						var childId = children[i].linear_index;
						var isExist = svg.select('#bar-id' + childId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
							.attr("fill") != removeColor;
						if(isExist){
							svg.selectAll('#bar-id' + childId  + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.classed("children-highlight",true);
							var childWidth = +svg.select('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.attr("width");
							var childX = +svg.select('#bar-id' + childId + "rect_background_index-" + barcoded_tree_rectbackground_index)
								.attr("x") + childWidth / 2;
							var radius = (childX - thisX) / 2;
							var line = d3.svg.line.radial()
								.interpolate("basis")
								.tension(0)
								.radius(radius)
								.angle(function(d, i) { return angle(i); });
							var rectLink =	"M" + (-radius) + "," + 0 +
								"L" + (-radius)  + "," + linkHeight + 
								"L" + (radius) + "," + linkHeight +
								"L" + (radius) + "," + 0;
							if(thisWidth != 0 && childWidth != 0){
								svg.append("path")
							   	.datum(d3.range(points))
								.attr("class", "line " + "bg-" + barcoded_tree_rectbackground_index + "f-" + thisIndex 
					    				+ " bg-" + barcoded_tree_rectbackground_index + "c-" + childId 
										+ " arc_background_index-" + barcoded_tree_rectbackground_index
										+ " class_end"
					    		)
					    		.attr('id','path-f' + fatherId +'-c-'+ thisIndex)
					    		.attr("d", rectLink)
					    		.attr("transform", "translate(" + (thisX + radius) + ", " + 
					    					(thisY + thisHeight) + ")");
							}
						}	
					}
				}
				if(d._father!=undefined){
				   	svg.selectAll(".father-" + d._father.linear_index +
				   				  "subtree-" + d.nth_different_subtree + 
				   				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				   	.classed("same-sibling",true);
				}
			}
			/*
			* @function: mouseoutReduceHandler 鼠标out的响应事件(reduce模式)
			* @parameter: d, i  d3的原始的参数
			*/
			function mouseoutReduceHandler(d,i,svg_id){
				radialTip.hide(d);
				var thisIndex = d.linear_index;
				if (document.getElementById("highlight_self").checked){
					d3.selectAll('.bar-id' + thisIndex).classed("this-highlight",true);
				}
				d3.selectAll(".line").remove();
				d3.selectAll('.bar-class')
					.classed("sibiling-highlight",false);
				d3.selectAll('.bar-class')
					.classed("father-highlight",false);
				d3.selectAll('.bar-class')
					.classed("children-highlight",false);
				d3.selectAll('.bar-class')
					.classed("this-highlight",false);
				d3.selectAll('path')
					.classed('path-highlight',false);
				d3.selectAll('path')
				   	.classed('children-highlight',false);
			    d3.selectAll('path')
				   	.classed('father-highlight',false);
				if(d._father != undefined){
				   	d3.selectAll(".father-" + d._father.linear_index + 
				   				  "subtree-" + d.nth_different_subtree +
				   				  "rect_background_index-" + barcoded_tree_rectbackground_index)
				   	.classed("same-sibling",false);
				}
			}
			//传入三角形的位置，然后将三角形绘制在对应的位置上
			function draw_adjust_button(desObject, index)
			{
				this_class = desObject.treeDes;
				index = desObject.treeIndex;
				var svg_id = desObject.svgId;
				var svg = d3.select("#" + svg_id);
				if(svg_id == setOperationSvgName && index >= 2){
					return;
				}
				var this_x = +svg.select("." + this_class + "-bg-" + index).attr("x"),
					this_y = +svg.select("." + this_class + "-bg-" + index).attr("y"),
					this_width = +svg.select("." + this_class + "-bg-" + index).attr("width"),
					this_height = +svg.select("." + this_class + "-bg-" + index).attr("height");
				var rect_attribute_button={
					height:50,
					biasx:this_x+this_width/2,
					biasy:this_y+this_height,
					cur_id:"ratio_adjust",
					button_shape: (	"M" + 0 + "," + 0 + 
									"L" + -4 + ","+ 12 + 
									"L" + 4 + ","+ 12 +
									"L" + 0 + "," + 0),
					background_color: "black",
					cur_svg:svg
				};		
				if(this_width != 0){
					creat_button(rect_attribute_button);
				}
				function creat_button(rect_attribute_button){
					var width = rect_attribute_button.width;  
					var height = rect_attribute_button.height; 
					var biasx=rect_attribute_button.biasx;
					var biasy=rect_attribute_button.biasy;
					var background_color=rect_attribute_button.background_color;
					var mouseover_function=rect_attribute_button.mouseover_function;
					var mouseout_function=rect_attribute_button.mouseout_function;
					var mouseclick_function=rect_attribute_button.mouseclick_function;
					var shown_string=rect_attribute_button.button_string;
					var font_color=rect_attribute_button.font_color;
					var font_size=rect_attribute_button.font_size;
					var cur_id=rect_attribute_button.cur_id;
					var cur_class=rect_attribute_button.cur_class;
					var cur_data=rect_attribute_button.cur_data;
					var cur_button_shape=rect_attribute_button.button_shape;
					var cur_svg=rect_attribute_button.cur_svg;
						
					var tooltip=d3.selectAll("#tooltip");
					if (typeof(cur_button_shape)=="undefined")
					{
						var button = cur_svg.append("rect");
					}
					else//自定义按钮形状
					{
						var button = cur_svg.append("path")
									 		.attr("d",cur_button_shape)
									 		.attr("stroke","black")
									 		.attr("stroke-width",1);
					}
					button.datum(cur_data)//绑定数据以后，后面的function才能接到d，否则只能接到this
							.on("mouseover",mouseover_function)
							.on("click",mouseclick_function)
							.on("mouseout",function(){
								if (typeof(mouseout_function)!="undefined")
									mouseout_function(this);
								tooltip.style("opacity",0.0);
							})
							.on("mousemove",function(){
								// 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 
								tooltip.style("left", (d3.event.pageX) + "px")
										.style("top", (d3.event.pageY + 20) + "px");
							})
							.attr("class","rect_button triangle triangle-" + index)
							.attr("id",cur_id)						
							.attr("style",	"width:"+width+"px;"+
											"height:"+height+"px;"+
											"color:"+font_color+";"+
											"font-size:"+font_size)
							.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy) + ")";  
							}) 
							.attr("fill",function(d,i){  
								return background_color;  
							});
				}
			}
			function get_index(GlobalTreeDesArray, treeDesNow){
				var index = -1;
				for(var i = 0; i < GlobalTreeDesArray.length; i++){
					if(GlobalTreeDesArray[i].treeDes == treeDesNow){
						index = i;
						break;
					}
				}
				return index;
			}
			$("#default").attr("checked",true);
			$("#radial-depth-controller").unbind().on("click", ".level-btn", function(){
				var dep = $(this).attr("level");
				shown_depth = dep;
				var treeDesNow = undefined;
				$("#radial-depth-controller .level-btn").removeClass("active");		
				for (var i = 0; i <= dep; i++)
					$("#radial-depth-controller .level-btn[level=" + i + "]").addClass("active");
				if(GlobalFormerDepth < dep){
					if($("#state-change").hasClass("active")){
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_reduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,radialSvgName);
						}
						for(var j = 0; j < setOperationNum; j++){
							animation_reduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,setOperationSvgName);
						}
					}else{
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_unreduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,radialSvgName);
						}
						for(var j = 0; j < setOperationNum; j++){
							animation_unreduced_barcoded_tree_depthchange_stretch(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,setOperationSvgName);
						}
					}
				}else if(GlobalFormerDepth > dep){
					if($("#state-change").hasClass("active")){
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_reduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,radialSvgName);
						}
						for(var j = 0; j < setOperationNum; j++){
							animation_reduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,setOperationSvgName);							
						}
					}else{
						for(var j = 0; j < linearTreeArray.length; j++){
							animation_unreduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,radialSvgName);
						}
						for(var j = 0; j < setOperationNum; j++){
							animation_unreduced_barcoded_tree_depthchange_shrink(GlobalFormerDepth,GlobalFormerDepth,dep,GlobalTreeDesArray,treeDesNow,j,setOperationSvgName);							
						}
					}
				}
				GlobalFormerDepth = dep;

				for (var i=0;i<tip_array.length;++i){
					tip_array[i].hide();
				}
				for (var i=0;i<maintain_tooltip_display.length;++i)
				{
					maintain_tooltip_display[i]=false;
				}
			});
			$("#state-change").unbind().click(function(){
				if($("#state-change").hasClass("active")){
					for(var j = 0; j < linearTreeArray.length; j++){
						animation_reduced2unreduced(GlobalFormerDepth, j, radialSvgName);
					}
					for(var j = 0; j < setOperationNum; j++){
						animation_reduced2unreduced(GlobalFormerDepth, j, setOperationSvgName);
					}
					$("#state-change").removeClass("active");
					var originButtonNodeArray = get_origin_attr();
					//draw_button(originButtonNodeArray);
				}else{
					for(var j = 0; j < linearTreeArray.length; j++){
						animation_unreduced2reduced(GlobalFormerDepth, j, radialSvgName);
					}
					for(var j = 0;j < setOperationNum; j++){
						animation_unreduced2reduced(GlobalFormerDepth, j, setOperationSvgName);
					}
					$("#state-change").addClass("active");
					var originButtonNodeArray = get_reduce_attr();
					//draw_reduce_button(originButtonNodeArray);
				}
			});
		    Radial.OMListen = function(message, data) {
		    	if(message == "treeselectsend_radialreceive_highlight"){
		    		var cur_highlight_depth=data;
		    		var changeClass = "hover-depth-" + cur_highlight_depth;
		    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,true);
		    	}
		    	if(message == "treeselectsend_radialreceive_disable_highlight"){
		    		var cur_highlight_depth=data;
		    		var changeClass = "hover-depth-" + cur_highlight_depth;
		    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,false);
		    	}
		    }
		    return Radial;
	}
}
	$('#switch-button').on('switchChange.bootstrapSwitch', function(event, state) {
		  isReduce = !state;
	});
	$('#set-operation').on('switchChange.bootstrapSwitch', function(event, state) {
		var effect = 'slide';
	    // Set the options for the effect type chosen
	    var options_down = { direction: "down" };
	    var options_right = { direction: "right" };
	    if(state){
	    	document.getElementById('radial-draw-svg').style.height = (height - 140) + 'px';	    	
	    }else{
	    	document.getElementById('radial-draw-svg').style.height = height + 'px';
	    }
	    // Set the duration (default: 400 milliseconds)
	    var duration = 500;
		$('#clientsDropDown #clientsDashboard').toggle(effect, options_down, duration);
		$('#show-right').toggle(effect, options_right, duration);
		//$(this).toggleClass('clientsClose');
	});