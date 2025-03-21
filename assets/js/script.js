document.addEventListener("DOMContentLoaded", function () {

    let selectedCountries = [];
    const countries = document.querySelectorAll(".country");
    const compareBtn = document.querySelector(".compare-btn");
    const warningText = document.querySelector('.warning-txt');
    const countriesContainer = document.querySelector('.countries-container');
    const buttonContainer = document.querySelector(".btn-container");
    const dataContainer = document.querySelector(".data-container");
    const comparator = document.querySelector(".js-compare");
    const monthyearTitle = document.querySelector(".js-month-year");
    const deviceCompare = document.querySelector(".device-compare");
    const headerHeight = document.querySelector('.header').offsetHeight;
    const selectFirst = document.querySelector('.js-first-selected');
    const selectSecond = document.querySelector('.js-second-selected');
    const monthMap = {
        "Jan": "January", "Feb": "February", "Mar": "March",
        "Apr": "April", "May": "May", "Jun": "June",
        "Jul": "July", "Aug": "August", "Sep": "September",
        "Oct": "October", "Nov": "November", "Dec": "December"
    };
    let data = {};

    // Load data from json
    fetch("assets/js/country_data.json")
        .then(response => response.json())
        .then(jsonData => {
            data = jsonData;
        })
        .catch(error => console.error("Error loading data:", error));
    countries.forEach(country => {
        country.addEventListener("click", function () {
            const countryName = this.getAttribute("data-name");
            if (selectedCountries.includes(countryName)) {
                selectedCountries = selectedCountries.filter(c => c !== countryName);
                this.classList.remove("active");
            } else {
                if (selectedCountries.length < 2) {
                    selectedCountries.push(countryName);
                    this.classList.add("active");
                } else {
                    warningText.style.opacity = "1";

                    setTimeout(() => {
                        warningText.style.opacity = "0";
                    }, 3000);
                    return;
                }
            }
            compareBtn.disabled = selectedCountries.length !== 2;
        });
    });
    compareBtn.addEventListener("click", function () {
        if (this.disabled) return;
        const selected = document.querySelector(".month-period .selected").textContent;
        updateYearMonthSelectedValue(selected);
        updateComparisonDisplay();
        slowScrollTo(document.querySelector(".compare-area"), 800);
    });

    function checkScroll() {
        let results = document.querySelector(".result-area");
        let compareData = document.querySelector(".compare-data");
        let rectResults = results.getBoundingClientRect();
        let rectCompareData = compareData.getBoundingClientRect();

        if (rectResults.top <= 50) {
            comparator.style.transform = "translateY(" + headerHeight + "px)";
        } else {
            comparator.style.transform = "translateY(-" + comparator.offsetHeight + "px)";
        }
        if (rectCompareData.top >= 0 && rectCompareData.bottom <= window.innerHeight) {
            comparator.style.transform = "translateY(-" + comparator.offsetHeight + "px)";
        }
    }

    // Event listener to check scroll position
    window.addEventListener("scroll", checkScroll);
    // Custom smooth scroll function
    function slowScrollTo(target, duration) {
        const extraHeight = document.querySelector('.comparator').offsetHeight;
        let start = window.scrollY,
            end = target.getBoundingClientRect().top + window.scrollY - extraHeight,
            startTime = performance.now();

        function scrollStep(timestamp) {
            let elapsed = timestamp - startTime,
                progress = Math.min(elapsed / duration, 1); // Ensure progress stays between 0-1

            window.scrollTo(0, start + (end - start) * easeOutQuad(progress));
            if (progress < 1) requestAnimationFrame(scrollStep);
        }
        function easeOutQuad(t) {
            return t * (2 - t); // Easing function for smooth deceleration
        }

        requestAnimationFrame(scrollStep);
    }

    function updateYearMonthSelectedValue(selectedPeriod) {
        const { startMonth, startYear, endMonth, endYear } = parseSelectedPeriod(selectedPeriod);
        document.querySelector("#month-year-select .selected").textContent = `${monthMap[endMonth]} ${startYear}`;
        monthyearTitle.textContent = `${monthMap[endMonth]} ${startYear}`;
    }

    function updateComparisonDisplay() {
        countriesContainer.innerHTML = "";
        const buttonList = document.createElement("div");
        buttonList.classList.add("btn-list");

        const tabList = document.createElement("ul");
        tabList.classList.add("tab-list");

        // Get selected countries and display their names, flags, and maps
        selectedCountries.forEach(countryName => {
            const country = [...countries].find(c => c.getAttribute("data-name") === countryName);
            const flagImg = country.querySelector(".flag").src;
            const mapImg = country.querySelector(".map").src;
            const selectedCountry = document.createElement("div");
            selectedCountry.classList.add("selected-country");

            const flag = document.createElement("img");
            flag.src = flagImg;
            flag.alt = `${countryName} Flag`;
            flag.classList.add("flag");

            const map = document.createElement("img");
            map.src = mapImg;
            map.alt = `${countryName} Map`;
            map.classList.add("map", "uk-visible@m");

            const name = document.createElement("span");
            name.classList.add("country-name");
            name.textContent = countryName;

            const countryImg = document.createElement("div");
            countryImg.classList.add("country-img");

            countryImg.appendChild(flag);
            countryImg.appendChild(map);

            selectedCountry.appendChild(countryImg);
            selectedCountry.appendChild(name);
            countriesContainer.appendChild(selectedCountry);
        });
        const vs = document.createElement("span");
        vs.textContent = "VS";
        vs.classList.add("uk-text-bold", "uk-hidden@m", "txt-vs");
        countriesContainer.appendChild(vs);

        // Clear old list elements before adding new ones
        document.querySelectorAll(".btn-list").forEach(btn => btn.remove());
        document.querySelectorAll(".tab-list").forEach(tab => tab.remove());

        // Get selected period from the month-period select box
        const monthPeriod = document.querySelector(".month-period");
        const selectedPeriod = monthPeriod.querySelector(".selected").textContent;
        const parsedData = parseSelectedPeriod(selectedPeriod);

        let { startMonth, startYear, endMonth, endYear } = parsedData;

        // Generate buttons for the selected months
        let months = Object.keys(monthMap);
        let startIndex = months.indexOf(startMonth);
        let endIndex = months.indexOf(endMonth);

        // Create month buttons & tabs
        for (let i = startIndex; i <= endIndex; i++) {
            let month = months[i];
            let button = document.createElement("button");
            button.classList.add("month-btn");
            button.setAttribute("data-value", `${startYear} ${month}`);
            button.textContent = monthMap[month];

            let tab = document.createElement("li");
            tab.classList.add("month-tab", "uk-text-center", "uk-text-bold");
            tab.setAttribute("data-value", `${startYear} ${month}`);
            tab.textContent = month;

            // Set default button as active
            if (i === endIndex) {
                button.classList.add("active");
                tab.classList.add("active");
                showDataForMonth(startYear, month);
            }

            button.addEventListener("click", function () {
                // Hide previous data and show new data
                document.querySelectorAll(".month-btn").forEach(btn => btn.classList.remove("active"));
                this.classList.add("active");
                showDataForMonth(startYear, month);
            });

            tab.addEventListener("click", function () {
                // Hide previous data and show new data
                document.querySelectorAll(".month-tab").forEach(tab => tab.classList.remove("active"));
                this.classList.add("active");
                monthyearTitle.textContent = monthMap[month] + ' ' + `${startYear}`;
                showDataForMonth(startYear, month);
                slowScrollTo(document.querySelector(".compare-area"), 800);
            });

            tabList.appendChild(tab);
            deviceCompare.appendChild(tabList);
            buttonList.appendChild(button);
            buttonContainer.appendChild(buttonList);
        }

        // Update the month-year select box based on the selected period
        handlePeriodChange();
        // Highlight countries on the map
        updateCountryHighlight();
        // Update the selected countries in the select boxes
        updateCountrySelectBoxes();
    }

    // Function to update the country select boxes when comparing countries
    function updateCountrySelectBoxes() {
        const firstCountrySelect = document.querySelector("#first-country .selected");
        const secondCountrySelect = document.querySelector("#second-country .selected");

        // Update the first select box
        firstCountrySelect.textContent = selectedCountries[0];
        const firstFlag = document.createElement("img");
        const firstCountry = [...countries].find(c => c.getAttribute("data-name") === selectedCountries[0]);
        firstFlag.src = firstCountry.querySelector(".flag").src;
        firstFlag.alt = `${selectedCountries[0]} Flag`;
        firstFlag.classList.add("flag");
        firstCountrySelect.innerHTML = "";
        firstCountrySelect.appendChild(firstFlag);
        firstCountrySelect.appendChild(document.createTextNode(selectedCountries[0]));
        selectFirst.innerHTML = "";
        selectFirst.appendChild(firstFlag);
        selectFirst.appendChild(document.createTextNode(selectedCountries[0]));

        // Update the second select box
        secondCountrySelect.textContent = selectedCountries[1];
        const secondFlag = document.createElement("img");
        const secondCountry = [...countries].find(c => c.getAttribute("data-name") === selectedCountries[1]);
        secondFlag.src = secondCountry.querySelector(".flag").src;
        secondFlag.alt = `${selectedCountries[1]} Flag`;
        secondFlag.classList.add("flag");
        secondCountrySelect.innerHTML = "";
        secondCountrySelect.appendChild(secondFlag);
        secondCountrySelect.appendChild(document.createTextNode(selectedCountries[1]));
        selectSecond.innerHTML = "";
        selectSecond.appendChild(document.createTextNode(selectedCountries[1]));
        selectSecond.appendChild(secondFlag);
    }


    function parseSelectedPeriod(selectedPeriod) {
        if (!selectedPeriod) return null;
        // Check if the format is "Month Year - Month Year"
        const match = selectedPeriod.match(/(\w+) (\d{4}) - (\w+) (\d{4})/);

        if (match) {
            return {
                startMonth: match[1],
                startYear: parseInt(match[2]),
                endMonth: match[3],
                endYear: parseInt(match[4])
            };
        }

        // Check if the format is "Month Year"
        const singleMonthMatch = selectedPeriod.match(/(\w+) (\d{4})/);

        if (singleMonthMatch) {
            return {
                startMonth: singleMonthMatch[1],
                startYear: parseInt(singleMonthMatch[2]),
                endMonth: singleMonthMatch[1],
                endYear: parseInt(singleMonthMatch[2])
            };
        }

        return null;
    }


    function showDataForMonth(year, month) {
        dataContainer.innerHTML = "";

        // Get data for each selected country for the selected month
        const countryDataArr = selectedCountries.map(countryName => {
            const monthData = data[year] && data[year][month];
            return monthData ? monthData.find(item => item.country === countryName) : null;
        });

        // Ensure we have two valid country data objects
        if (countryDataArr.includes(null)) {
            dataContainer.innerHTML = `<p>No data available for selected month.</p>`;
            return;
        }

        const [country1, country2] = countryDataArr;
        // Create comparison result container
        const compareResult = document.createElement("div");
        compareResult.classList.add("compare-result");

        // TRADE INDEXES TITLE
        const tradeTitle = document.createElement("div");
        tradeTitle.classList.add("result-ttl", "uk-margin-medium");
        tradeTitle.textContent = "TRADE INDEXES";
        compareResult.appendChild(tradeTitle);

        // TRADE INDEXES LIST
        const tradeList = document.createElement("div");
        tradeList.classList.add("result-list");
        compareResult.appendChild(tradeList);

        const tradeCategories = ["country_trade", "air_trade", "ocean_trade"];
        const tradeLabels = ["Country Trade", "Air Trade", "Ocean Trade"];

        tradeCategories.forEach((category, index) => {
            tradeList.appendChild(createComparisonItem(
                country1.trade_indexes[category],
                tradeLabels[index],
                country2.trade_indexes[category]
            ));
        });

        // DEVELOPMENTS TITLE
        const devTitle = document.createElement("div");
        devTitle.classList.add("result-ttl", "uk-margin-medium");
        devTitle.textContent = "SECTOR DEVELOPMENTS";
        compareResult.appendChild(devTitle);

        // DEVELOPMENTS LIST
        const devList = document.createElement("div");
        devList.classList.add("result-list");
        compareResult.appendChild(devList);
        const devCategories = ["basic", "capital", "chemicals", "consumer_fashion", "technology", "industrial", "land", "machinary", "household", "climate"];
        const devLabels = ["Basic Raw Materials", "Capital Equip. & Machinery", "Chemicals & Products", "Consumer Fashion Goods", "High Technology", "Industrial Raw Materials", "Land Vehicles & Parts", "Machinery Parts", "Personal & Household Goods", "Temp. or Climate Control"];

        devCategories.forEach((category, index) => {
            devList.appendChild(createComparisonItem(
                country1.development[category],
                devLabels[index],
                country2.development[category]
            ));
        });

        // Append final results to data container
        dataContainer.appendChild(compareResult);
    }

    // Function to create a comparison item
    function createComparisonItem(value1, label, value2) {
        const resultItem = document.createElement("div");
        resultItem.classList.add("result-item", "uk-position-relative");
        const fill = document.createElement("span");
        fill.classList.add("fill", "uk-position-abssolute");
        const animatefill = document.createElement("span");
        animatefill.classList.add("animate-fill", "uk-position-abssolute");
        const num1 = document.createElement("span");
        num1.classList.add("num", "uk-position-relative");
        num1.textContent = value1;

        const type = document.createElement("span");
        type.classList.add("type", "uk-position-relative");
        type.textContent = label;

        const num2 = document.createElement("span");
        num2.classList.add("num", "uk-position-relative");
        num2.textContent = value2;
        let max = Math.max(value1, value2);
        let min = Math.min(value1, value2);
        let fillWidth = (min / max) * 100;

        // Check if the greater number is on the left or right
        let isLeft = value1 > value2;
        fill.style.width = fillWidth + "%";
        fill.style[isLeft ? "left" : "right"] = "0";
        fill.style[isLeft ? "right" : "left"] = "auto";
        animatefill.style.width = "0";
        animatefill.style[isLeft ? "left" : "right"] = "0";
        animatefill.style[isLeft ? "right" : "left"] = "auto";
        if (value1 > value2) {
            num1.classList.add("uk-text-bold");
        } else if (value2 > value1) {
            num2.classList.add("uk-text-bold");
        }

        resultItem.appendChild(fill);
        resultItem.appendChild(animatefill);
        resultItem.appendChild(num1);
        resultItem.appendChild(type);
        resultItem.appendChild(num2);
        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            animatefill.style.width = fillWidth + "%";
                        }, 100);

                    } else {
                        animatefill.style.width = "0";
                    }
                });
            },
            { threshold: 0.5 }
        );

        observer.observe(resultItem);
        return resultItem;
    }

    // Custom Select Box
    const selectBoxes = document.querySelectorAll(".custom-select");
    selectBoxes.forEach(function (selectBox) {
        const jsselect = selectBox.querySelector(".js-selected");
        const selectedText = selectBox.querySelector(".selected");
        const options = selectBox.querySelectorAll(".options span");
        jsselect.addEventListener("click", function () {
            selectBox.classList.toggle("open");
        });
        options.forEach(option => {
            option.addEventListener("click", function () {
                selectedText.innerHTML = this.innerText;
                selectBox.classList.remove("open");
                updateActiveCountries();
            });
        });

        // Close dropdown if clicked outside
        document.addEventListener("click", function (e) {
            if (!selectBox.contains(e.target)) {
                selectBox.classList.remove("open");
            }
        });
    });


    let previousPeriod = "";

    // Function to handle month-period change
    function handlePeriodChange() {
        const selectedPeriod = document.querySelector(".month-period .selected").textContent;

        // If the selected period is different from the previous one, update
        if (selectedPeriod !== previousPeriod) {
            updateCustomSelectBoxes(selectedPeriod);
            previousPeriod = selectedPeriod;
        } else {
            const { startMonth, startYear, endMonth, endYear } = parseSelectedPeriod(selectedPeriod);
            const selectedMonth = document.querySelector("#month-year-select .selected");
            if (!selectedMonth.textContent) {
                selectedMonth.textContent = `${monthMap[endMonth]} ${endYear}`;
            }
            if (!monthyearTitle.textContent) {
                monthyearTitle.textContent = `${monthMap[endMonth]} ${endYear}`;
            }
        }
    }

    // Function to update custom select boxes
    function updateCustomSelectBoxes(selectedPeriod) {
        const firstSelect = document.querySelector("#first-country .options");
        const secondSelect = document.querySelector("#second-country .options");
        const yearMonthSelect = document.querySelector("#month-year-select .options");

        // Clear previous options
        firstSelect.innerHTML = "";
        secondSelect.innerHTML = "";
        yearMonthSelect.innerHTML = "";

        // Populate country select boxes
        countries.forEach(country => {
            const countryName = country.getAttribute("data-name");
            const flagImg = country.querySelector(".flag").src;

            // Create a div for the flag image
            const countryFlag = document.createElement("img");
            countryFlag.src = flagImg;
            countryFlag.alt = `${countryName} Flag`;
            countryFlag.classList.add("flag");

            let firstOption = document.createElement("span");
            firstOption.textContent = countryName;
            firstOption.dataset.value = countryName;

            let secondOption = document.createElement("span");
            secondOption.textContent = countryName;
            secondOption.dataset.value = countryName;
            // Append a new flag for both options, ensuring they are separate elements
            const firstOptionFlag = document.createElement("img");
            firstOptionFlag.src = flagImg;
            firstOptionFlag.alt = `${countryName} Flag`;
            firstOptionFlag.classList.add("flag");

            const secondOptionFlag = document.createElement("img");
            secondOptionFlag.src = flagImg;
            secondOptionFlag.alt = `${countryName} Flag`;
            secondOptionFlag.classList.add("flag");

            firstOption.append(firstOptionFlag);
            secondOption.append(secondOptionFlag);

            // Set initial disabled state
            if (countryName === selectedCountries[1]) firstOption.classList.add("disabled");
            if (countryName === selectedCountries[0]) secondOption.classList.add("disabled");

            firstOption.addEventListener("click", function () {
                document.querySelector("#first-country .selected").textContent = countryName;
                const firstSelected = document.querySelector("#first-country .selected");
                firstSelected.innerHTML = "";
                firstSelected.appendChild(countryFlag);
                firstSelected.appendChild(document.createTextNode(countryName));
                selectedCountries[0] = countryName;
                updateDisabledStates();
                updateCountryHighlight();
                updateComparisonResults();
            });

            secondOption.addEventListener("click", function () {
                document.querySelector("#second-country .selected").textContent = countryName;
                const secondSelected = document.querySelector("#second-country .selected");
                secondSelected.innerHTML = "";
                secondSelected.appendChild(countryFlag);
                secondSelected.appendChild(document.createTextNode(countryName));
                selectedCountries[1] = countryName;
                updateDisabledStates();
                updateCountryHighlight();
                updateComparisonResults();
            });

            firstSelect.appendChild(firstOption);
            secondSelect.appendChild(secondOption);
        });

        const firstSelected = document.querySelector("#first-country .selected");
        const secondSelected = document.querySelector("#second-country .selected");
        // Set selected values for countries
        firstSelected.textContent = selectedCountries[0];
        secondSelected.textContent = selectedCountries[1];
        if (selectedCountries[0]) {
            const firstSelectedCountry = [...countries].find(country => country.getAttribute("data-name") === selectedCountries[0]);
            if (firstSelectedCountry) selectedDataUpdate(firstSelectedCountry, firstSelected, 0);
        }
        if (selectedCountries[1]) {
            const secondSelectedCountry = [...countries].find(country => country.getAttribute("data-name") === selectedCountries[1]);
            if (secondSelectedCountry) selectedDataUpdate(secondSelectedCountry, secondSelected, 1);
        }

        function selectedDataUpdate(selectCountry, selected, number) {
            if (!selectCountry) {
                console.warn(`Selected country ${selectedCountries[number] || "undefined"} not found.`);
                return;
            }
            const selectedFlagElement = selectCountry.querySelector(".flag");
            if (!selectedFlagElement) {
                console.warn(`Flag image not found for ${selectedCountries[number]}.`);
                return;
            }
            const selectedFlag = selectedFlagElement.src;
            const selectedImg = document.createElement("img");
            selectedImg.src = selectedFlag;
            selectedImg.alt = `${selectedCountries[number]} Flag`;
            selectedImg.classList.add("flag");

            selected.innerHTML = "";
            selected.appendChild(selectedImg);
            selected.appendChild(document.createTextNode(selectedCountries[number]));
        }

        // Populate year-month select box based on the selected period
        const { startMonth, startYear, endMonth, endYear } = parseSelectedPeriod(selectedPeriod);

        let months = Object.keys(monthMap);
        let startIndex = months.indexOf(startMonth);
        let endIndex = months.indexOf(endMonth);

        let lastSelectedOption = null;  // To store the last selected option

        for (let i = startIndex; i <= endIndex; i++) {
            let month = months[i];
            let option = document.createElement("span");
            option.textContent = `${monthMap[month]} ${startYear}`;
            option.dataset.value = `${startYear} ${month}`;

            if (i === endIndex) {
                lastSelectedOption = option;  // Store the last option
            }
            option.addEventListener("click", function () {
                // Update the selected value in the select box
                document.querySelector("#month-year-select .selected").textContent = option.textContent;
                this.closest(".custom-select").classList.remove("open");
                let selectedValue = option.dataset.value;

                // Update the active month button
                document.querySelectorAll(".month-btn").forEach(btn => {
                    btn.classList.remove("active"); // Remove active from all
                    if (btn.getAttribute("data-value") === selectedValue) {
                        btn.classList.add("active"); // Add active to matching button
                    }
                });

                // Update comparison results for the selected month
                let [year, month] = selectedValue.split(" ");
                showDataForMonth(year, month);
            });
            yearMonthSelect.appendChild(option);
        }

        // Set default selected month if not already set
        const selectedMonth = document.querySelector("#month-year-select .selected");

        if (!selectedMonth.textContent && lastSelectedOption) {
            document.querySelector("#month-year-select .selected").textContent = lastSelectedOption.textContent;
        }
    }

    // Function to update the disabled state dynamically
    function updateDisabledStates() {
        document.querySelectorAll("#first-country .options span").forEach(option => {
            option.classList.remove("disabled");
            if (option.dataset.value === selectedCountries[1]) {
                option.classList.add("disabled");
            }
        });

        document.querySelectorAll("#second-country .options span").forEach(option => {
            option.classList.remove("disabled");
            if (option.dataset.value === selectedCountries[0]) {
                option.classList.add("disabled");
            }
        });
    }

    // Event listener for when the period is changed
    document.querySelector(".month-period").addEventListener("click", function () {
        handlePeriodChange();
    });

    function updateCountryHighlight() {
        document.querySelectorAll(".country").forEach(country => {
            country.classList.remove("active");
            if (selectedCountries.includes(country.getAttribute("data-name"))) {
                country.classList.add("active");
            }
        });
    }
    function updateComparisonResults() {
        const firstCountry = document.querySelector("#first-country .selected").textContent.trim();
        const secondCountry = document.querySelector("#second-country .selected").textContent.trim();
        const selectedPeriod = document.querySelector("#month-year-select .selected").textContent.trim();

        if (!firstCountry || !secondCountry || !selectedPeriod) return;

        const parsedPeriod = parseSelectedPeriod(selectedPeriod);

        // Check if parseSelectedPeriod returned a valid object
        if (!parsedPeriod) {
            console.error('Invalid period selected.');
            return;
        }

        const { startYear, startMonth, endYear, endMonth } = parsedPeriod;

        if (!startYear) return; // Prevent errors if period parsing fails
        updateComparisonDisplay();
    }

    function updateActiveCountries() {
        document.querySelectorAll(".country").forEach(country => {
            country.classList.remove("active"); // Remove active from all
        });

        // Get selected country names from select boxes
        const firstSelected = document.querySelector("#first-country .selected").innerText;
        const secondSelected = document.querySelector("#second-country .selected").innerText;
        // Add active class to selected countries
        document.querySelectorAll(".country").forEach(country => {
            if (country.getAttribute("data-name") === firstSelected ||
                country.getAttribute("data-name") === secondSelected) {
                country.classList.add("active");
            }
        });
    }

    // Attach event listeners for country select boxes
    document.querySelectorAll("#first-country .options, #second-country .options").forEach(selectBox => {
        selectBox.addEventListener("click", function (event) {
            if (event.target.tagName === "SPAN") {
                const selectedOption = event.target;
                const countryName = selectedOption.textContent.trim();
                const countryFlag = selectedOption.querySelector(".flag").src;

                const selectedCountryElement = event.currentTarget.parentElement.querySelector(".selected");
                selectedCountryElement.textContent = countryName;

                // Clear existing flag and append the new one
                selectedCountryElement.innerHTML = "";
                const flagImg = document.createElement("img");
                flagImg.src = countryFlag;
                flagImg.alt = `${countryName} Flag`;
                flagImg.classList.add("flag");
                selectedCountryElement.appendChild(flagImg);
                selectedCountryElement.appendChild(document.createTextNode(countryName));

                this.closest(".custom-select").classList.remove("open");

                selectedCountries = [
                    document.querySelector("#first-country .selected").textContent.trim(),
                    document.querySelector("#second-country .selected").textContent.trim()
                ];
                updateComparisonResults();
                updateActiveCountries();
            }
        });
    });


});