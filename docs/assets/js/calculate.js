(function(){
	function num(id){ return parseFloat(document.getElementById(id).value) || 0; }
	function text(id){ return document.getElementById(id).value || ''; }
	function fmt(n){ return n.toLocaleString(undefined, { maximumFractionDigits: 2 }); }

	let pieChart = null;

	// Initialize pie chart
	function initPieChart() {
		const canvas = document.getElementById('laytimePieChart');
		if (!canvas) return;
		
		const ctx = canvas.getContext('2d');
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 80;
		
		// Draw initial empty chart
		drawPieChart(ctx, centerX, centerY, radius, 0, 0);
	}

	// Draw pie chart
	function drawPieChart(ctx, centerX, centerY, radius, used, allowed) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		const total = allowed;
		const usedAngle = (used / total) * 2 * Math.PI;
		const remainingAngle = 2 * Math.PI - usedAngle;
		
		// Draw used portion (blue)
		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.arc(centerX, centerY, radius, 0, usedAngle);
		ctx.closePath();
		ctx.fillStyle = '#3b82f6';
		ctx.fill();
		
		// Draw remaining portion (green)
		if (remainingAngle > 0) {
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, radius, usedAngle, 2 * Math.PI);
			ctx.closePath();
			ctx.fillStyle = '#10b981';
			ctx.fill();
		}
		
		// Draw center circle (white background)
		ctx.beginPath();
		ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI);
		ctx.fillStyle = 'white';
		ctx.fill();
	}

	// Update pie chart
	function updatePieChart(used, allowed) {
		const canvas = document.getElementById('laytimePieChart');
		if (!canvas) return;
		
		const ctx = canvas.getContext('2d');
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		const radius = 80;
		
		drawPieChart(ctx, centerX, centerY, radius, used, allowed);
		
		// Update legend values
		document.getElementById('legend-used').textContent = fmt(used);
		document.getElementById('legend-remaining').textContent = fmt(Math.max(0, allowed - used));
		document.getElementById('pie-chart-total').textContent = fmt(allowed);
	}

	// Load data from localStorage and populate form
	function loadFormData() {
		console.log('Loading form data from localStorage');
		const formData = localStorage.getItem('calculateFormData');
		const events = localStorage.getItem('calculateEvents');
		
		console.log('Form data from localStorage:', formData);
		console.log('Events from localStorage:', events);
		
		if (formData) {
			const data = JSON.parse(formData);
			console.log('Parsed form data:', data);
			
			// Map extraction results data to calculate form fields
			document.getElementById('c-vessel').value = data.vesselName || '';
			document.getElementById('c-from').value = data.portLoading || '';
			document.getElementById('c-to').value = data.portDischarge || '';
			document.getElementById('c-cargo').value = data.cargo || '';
			document.getElementById('c-port').value = data.portDischarge || '';
			document.getElementById('c-allowed').value = data.allowedLaytime || '';
			document.getElementById('c-demurrage').value = data.demurrage || '';
			document.getElementById('c-dispatch').value = data.dispatch || '';
			document.getElementById('c-rate').value = data.rate || '';
			document.getElementById('c-qty').value = data.quantity || '';
		} else {
			// Show message if no data is available
			showNoDataMessage();
		}
		
		// Auto-calculate if we have data
		if (formData && events) {
			console.log('Auto-calculating with data');
			setTimeout(() => {
				performCalculation();
			}, 500);
		}
	}

	// Show no data message
	function showNoDataMessage() {
		// Hide cards and pie chart when no data
		document.getElementById('resultsCards').style.display = 'none';
		document.querySelector('.pie-chart-section').style.display = 'none';
	}

	// Perform the calculation
	function performCalculation() {
		const qty = num('c-qty');
		const rate = Math.max(num('c-rate'), 1);
		const allowed = Math.max(num('c-allowed'), 0);
		const demurrage = num('c-demurrage');
		const dispatch = num('c-dispatch');

		// Calculate based on events if available
		const events = localStorage.getItem('calculateEvents');
		let totalLaytimeUsed = 0;
		
		if (events) {
			const eventsData = JSON.parse(events);
			let totalHours = 0;
			
			eventsData.forEach(event => {
				if (event.startTime && event.endTime) {
					const start = new Date(`2000-01-01T${event.startTime}`);
					const end = new Date(`2000-01-01T${event.endTime}`);
					const duration = (end - start) / (1000 * 60 * 60); // hours
					totalHours += duration;
				}
			});
			
			totalLaytimeUsed = totalHours / 24; // Convert hours to days
		} else {
			// Fallback to cargo-based calculation
			totalLaytimeUsed = qty / rate;
		}

		const diff = +(totalLaytimeUsed - allowed).toFixed(2);
		const isDemurrage = diff > 0;
		const days = Math.abs(diff);
		const amountPerDay = isDemurrage ? demurrage : dispatch;
		const amount = +(days * amountPerDay).toFixed(2);

		// Display results
		displayResults({
			vessel: text('c-vessel'),
			port: text('c-port'),
			from: text('c-from'),
			to: text('c-to'),
			cargo: text('c-cargo'),
			used: totalLaytimeUsed,
			allowed: allowed,
			delta: days,
			isDemurrage: isDemurrage,
			amount: amount
		});

		// Update summary
		updateSummary({
			totalLaytimeUsed: totalLaytimeUsed,
			allowed: allowed,
			demurrageCost: isDemurrage ? amount : 0,
			dispatchCredit: !isDemurrage ? amount : 0
		});

		// Update pie chart
		updatePieChart(totalLaytimeUsed, allowed);
	}

	// Display results
	function displayResults(data) {
		// Show cards and pie chart
		document.getElementById('resultsCards').style.display = 'grid';
		document.querySelector('.pie-chart-section').style.display = 'flex';
	}

	// Update summary section
	function updateSummary(data) {
		// Update info cards
		document.getElementById('total-laytime-card').textContent = fmt(data.totalLaytimeUsed);
		document.getElementById('laytime-remaining-card').textContent = fmt(Math.max(0, data.allowed - data.totalLaytimeUsed));
		document.getElementById('demurrage-cost-card').textContent = `$${fmt(data.demurrageCost)}`;
		document.getElementById('dispatch-credit-card').textContent = `$${fmt(data.dispatchCredit)}`;
		
		// Show cards
		document.getElementById('resultsCards').style.display = 'grid';
	}

	// Load data when page loads
	document.addEventListener('DOMContentLoaded', function() {
		loadFormData();
		initPieChart();
	});

	// Calculate button event listener
	document.getElementById('c-calc').addEventListener('click', performCalculation);
})();
