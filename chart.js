// chart.js
document.addEventListener("DOMContentLoaded", async () => {
    const ctx = document.getElementById('salesChart').getContext('2d');

    try {
        // Отримуємо список всіх років
        const yearsResponse = await fetch('http://localhost:3000/years');
        const years = await yearsResponse.json();

        // Отримуємо сумарні продажі за кожен рік
        const salesData = [];
        for (const year of years) {
            const salesResponse = await fetch(`http://localhost:3000/sales/${year}`);
            const sales = await salesResponse.json();
            // Підсумовуємо поле 'sales', перетворюючи на число
            const totalSales = sales.reduce((sum, sale) => sum + Number(sale.sales || 0), 0);
            salesData.push(totalSales);
            console.log('Years:', years);
            console.log('Sales data:', salesData);
        }

        // Створюємо графік
        new Chart(ctx, {
            type: 'bar', // або 'line'
            data: {
                labels: years,
                datasets: [{
                    label: 'Annual Sales',
                    data: salesData,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: 'Car Sales by Year'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error loading chart data:', err);
    }
});