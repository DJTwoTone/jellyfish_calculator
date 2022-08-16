

const LOGIN_URL = "https://api-test.gojellyfish.link/app/auth/login";
const SIGNUP_URL = "https://api-test.gojellyfish.link/app/auth/signup";
const SEARCH_BY_TEXT_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-text/";
const SEARCH_BY_ID_BASE_URL = "https://api-test.gojellyfish.link/lab/ingredient/search-by-id/"
const LOGIN_TYPE = "1";


let fetchTimeoutID;

// Selectors

const addIngredientInput = document.getElementById("form__ingredient-search");
const ingredientChoiceArea = document.getElementById("search__ingredients-area");

const addIngredientForm = document.getElementById("calculator__form-add");

const recipeList = document.getElementById("recipe-list");

const servingSelector = document.getElementById("calculator__servings-selector");

const loginEmail = document.querySelector('#calculator__form-login-email');
const loginPassword = document.querySelector('#calculator__form-login-password');
const loginForm = document.querySelector('#calculator__form-login');
const loginError = document.querySelector('#calculator__login-error');

const signupForm = document.querySelector('#calculator__form-signup');
const signupError = document.querySelector('#calculator__signup-error');

const efficiencyPerServing = document.getElementById("efficiency-per-serving");
const efficiencyTotal = document.getElementById("efficiency-total");

const ingredientsResetButton = document.querySelector('#recipe-reset');


// Event Listeners

addIngredientInput.addEventListener('input', onType);
addIngredientForm.addEventListener('submit', addIngredientToRecipe);
servingSelector.addEventListener('click', selectedServings);

loginForm.addEventListener('submit', login);
signupForm.addEventListener('submit', signup);

ingredientsResetButton.addEventListener('click', resetIngredientsList);


// Functions


(function(){
    let token = localStorage.getItem('gojellytoken');

    if (token) {

        document.querySelector('#calculator__dialog').classList.add('closed');
        buildIngredientsList();
    }
})()

async function login (evt) {
    evt.preventDefault();
    let email = evt.target[0].value;
    let password = evt.target[1].value;

    let formdata = new FormData();
    
    formdata.append("email", email);
    formdata.append("password", password);

    let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
    };

    try {
        let res = await fetch("https://api-test.gojellyfish.link/app/auth/login", requestOptions)
        let result = await res.json();

        localStorage.setItem('gojellytoken', result.data.access_token);
        loginForm.reset();

        document.querySelector('#calculator__dialog').classList.add('closed');

    } catch (error) {
        loginForm.reset()
        loginError.innerText = 'There was a problem logging in. Try again.';
    }

}

async function signup (evt) {
    evt.preventDefault();
    let name = evt.target[0].value;
    let email = evt.target[1].value;
    let password = evt.target[2].value;
    let passwordConfirm = evt.target[3].value;

    let formdata = new FormData();
    formdata.append("login_type", LOGIN_TYPE);
    formdata.append("password", password);
    formdata.append("name", name);
    formdata.append("email", email);

    let requestOptions = {
    method: 'POST',
    body: formdata,
    redirect: 'follow'
    };

    try {
        if (password !== passwordConfirm) {
            throw new Error('Passwords do not match');
        }
        let res = await fetch("https://api-test.gojellyfish.link/app/auth/signup", requestOptions)
        let result = await res.json();
        localStorage.setItem('gojellytoken', result.data.access_token);
        signupForm.reset();
        // document.querySelector('#calculator__dialog').close()
        document.querySelector('#calculator__dialog').classList.add('closed');

    } catch (error) {
        signupForm.reset()
        signupError.innerText = error.message;
    }


}

function onType(){
    if (addIngredientInput.value.length === 0) {
        clearSuggestions();
        return
    }

    clearTimeout(fetchTimeoutID);
    fetchTimeoutID = setTimeout(fetchAndDisplayIngredients, 500);
}

function clearSuggestions() {
    clearTimeout(fetchTimeoutID);
    
    ingredientChoiceArea.innerHTML = '';
}

async function fetchAndDisplayIngredients() {
    let ingredientsArr = await fetchIngredients();
    if (!ingredientsArr) return;
    let trimmedIngredients = ingredientsArr.slice(0,6);

    ingredientChoiceArea.innerHTML = '';
    trimmedIngredients.forEach(ingredient => {
        let ingredientRadio = document.createElement('input');
        ingredientRadio.setAttribute('type', 'radio');
        ingredientRadio.setAttribute('name', 'ingredientId');
        ingredientRadio.setAttribute('value', ingredient.id);
        ingredientRadio.setAttribute('id', `ingredient-radio-${ingredient.id}`);
        ingredientRadio.classList.add('ingredients-area__item');
        ingredientRadio.innerHTML = `${ingredient.name}`;
        let ingredientRadioLabel = document.createElement('label');
        ingredientRadioLabel.setAttribute('for', `ingredient-radio-${ingredient.id}`);
        ingredientRadioLabel.innerText = `${ingredient.name}`;
        // ingredientItem.addEventListener('click', onIngredientClick);
        ingredientChoiceArea.appendChild(ingredientRadio);
        ingredientChoiceArea.appendChild(ingredientRadioLabel);
    })
}

async function fetchIngredients() {
    let token = localStorage.getItem('gojellytoken')
    let ingredientFetchHeader = new Headers();
    ingredientFetchHeader.append('Authorization', `Bearer ${token}`);

    let ingredientFetchOptions = {
        method: 'GET',
        headers: ingredientFetchHeader,
        redirect: 'follow'
    };

    let ingredientFetchUrl = new URL(SEARCH_BY_TEXT_BASE_URL);
    ingredientFetchUrl.searchParams.set('search_text', addIngredientInput.value);

    try {
        let res = await fetch(ingredientFetchUrl, ingredientFetchOptions);
        let result = await res.json();
        return result.data;
    } catch (error) {
        console.log(error);
    }

}

async function fetchIngredientById(id) {
    let token = localStorage.getItem('gojellytoken')
    let ingredientFetchHeader = new Headers();
    ingredientFetchHeader.append('Authorization', `Bearer ${token}`);

    let ingredientFetchOptions = {
        method: 'GET',
        headers: ingredientFetchHeader,
        redirect: 'follow'
    };

    let ingredientFetchUrl = new URL(SEARCH_BY_ID_BASE_URL);
    ingredientFetchUrl.searchParams.set('id', id);

    try {
        let res = await fetch(ingredientFetchUrl, ingredientFetchOptions);
        let result = await res.json();
        return result.data;
    } catch (error) {
        console.log(error);
    }
}

async function addIngredientToRecipe(evt) {
    evt.preventDefault();
    if (localStorage.getItem('gojellyrecipeingredients') === null) {
        localStorage.setItem("gojellyrecipeingredients", JSON.stringify([]))
    }
    const {ingredientId, unit, amount } = Object.fromEntries(new FormData(addIngredientForm).entries());

    
    // let testRes = await fetchIngredientById(ingredientId);
    let { name, gco2e } = await fetchIngredientById(ingredientId);


    let localStorageIngredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    localStorageIngredients.push({ingredientId, name, gco2e, unit, amount })
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify(localStorageIngredients));
    addIngredientForm.reset()
    ingredientChoiceArea.innerHTML = '';
    recipeList.innerHTML = "";
    buildIngredientsList();

    
}

function buildIngredientsList() {
    // get list from local storage
    const ingredientListFromLocalStorage = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    const servingsFromLocalStorage = localStorage.getItem('gojellyrecipeservings');


    
    if (!ingredientListFromLocalStorage) {
        return
    }

    if (!servingsFromLocalStorage) {
        localStorage.setItem('gojellyrecipeservings', 1)
    }
    
    let listFragment = document.createDocumentFragment();
    // iterate over list to build items
    for (item of ingredientListFromLocalStorage) {
        let itemToAdd = buildIngredientsListItem(item);
        listFragment.appendChild(itemToAdd);
    }
    // append items to list
    recipeList.appendChild(listFragment);
  
    deleteButtons = document.querySelectorAll('.calculator__ingredients-list-item-delete-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteRecipeItem);
    })

    efficiencyMath()
    // highlight best and worst
    // show highlight key
}

function buildIngredientsListItem(item) {
    let { ingredientId, name, gco2e, unit, amount } = item;
    let ingredientTr = document.createElement('tr');
    ingredientTr.classList.add('ingredients-list__item');
    ingredientTr.setAttribute('data-id', ingredientId);

    // let ingredientContainer = document.createElement('div');
    // let ingredientInfo = document.createElement('span');


    let ingredientName = document.createElement('td');
    let ingredientGco2e = document.createElement('td');
    let ingredientAmount = document.createElement('td');
    let ingredientTotal = document.createElement('td');
    
    let btnContainer = document.createElement('td');

    
    let deleteBtn = document.createElement('i');

    let totalgco2e = convertToGrams(item) * gco2e / 100;
    ingredientName.innerText = name;
    ingredientGco2e.innerText = `${gco2e} gCO2e`;
    ingredientAmount.innerText = `${amount} ${unit}`;
    // ingredientUnit.innerText = `${unit}`;
    ingredientTotal.innerText = `${totalgco2e.toFixed(2)} gCO2e`;

    // ingredientContainer.classList.add('ingredient-container');
    btnContainer.classList.add('btn-container');
    
    ingredientAmount.classList.add("ingredient-amount");
    // ingredientUnit.classList.add("ingredient-unit");
    ingredientName.classList.add("ingredient-name");
    
    
    deleteBtn.classList.add("fas", "fa-trash", 'calculator__ingredients-list-item-delete-btn');

    // ingredientInfo.append(ingredientName, ingredientAmount, ingredientUnit)
    // ingredientContainer.append(ingredientInfo, ingredientGco2e);
    btnContainer.append(deleteBtn);
    // ingredientLi.append(ingredientContainer, btnContainer)
    ingredientTr.append(ingredientName, ingredientAmount, ingredientGco2e, ingredientTotal, btnContainer);



    return ingredientTr;

}

function deleteRecipeItem(evt) {
    let id = evt.target.parentNode.parentNode.dataset.id;
    let localStorageIngredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    let newIngredients = localStorageIngredients.filter(item => item.ingredientId !== id);
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify(newIngredients));
    recipeList.innerHTML = "";
    buildIngredientsList();


}

function selectedServings (evt) {

    evt.target.parentNode.parentNode.childNodes.forEach(child => {

        if (child.childNodes[1]) child.childNodes[1].classList.remove('selected');
    }
    )

    evt.target.classList.add('selected');
    localStorage.setItem('gojellyrecipeservings', +evt.target.childNodes[0].data);
    efficiencyMath()
}

//convert to grams per serving
function convertToGrams(ingredient) {
    let { unit, amount } = ingredient;
    let convertedAmount = 0;
    switch (unit) {
        case 'mg':
            convertedAmount = amount / 1000;
            break;
        case 'g':
            convertedAmount = amount;
            break;
        case 'kg':
            convertedAmount = amount * 1000;
            break;
        case 'lb':
            convertedAmount = amount * 453.6;
            break;
        case 'oz':
            convertedAmount = amount * 28.35;
            break;
        case 'tsp':
            convertedAmount = amount / 647.096;
            break;
        case 'tbsp':
            convertedAmount = amount / 14.7868;
            break;
        case 'fl oz':
            convertedAmount = amount / 29.5735;
            break;
        case 'cup':
            convertedAmount = amount * 236.588;
            break;
        case 'pint':
            convertedAmount = amount * 473.176;
            break;
        case 'quart':
            convertedAmount = amount * 946.353;
            break;
        case 'gallon':
            convertedAmount = amount * 3,785.41;
            break;

        default:
            convertedAmount = amount;
            break;
    }
    return convertedAmount;
}

function resetIngredientsList() {
    recipeList.innerHTML = "";
    localStorage.setItem('gojellyrecipeingredients', JSON.stringify([]));
    efficiencyMath()
    
}

function efficiencyMath() {
    let ingredients = JSON.parse(localStorage.getItem('gojellyrecipeingredients'));
    let servings = localStorage.getItem('gojellyrecipeservings');

    if (ingredients.length === 0) {
        efficiencyPerServing.innerText = "0 gCO2e";
        efficiencyTotal.innerText = "0 gCO2e";
        return;
    }

    let totalgco2e = 0;
    ingredients.forEach(ingredient => {
        totalgco2e += convertToGrams(ingredient) * ingredient.gco2e / 100;
    }
    )
    let perServing = totalgco2e / servings;

    efficiencyPerServing.innerText = `${perServing.toFixed(2)} gCO2e per serving`;
    efficiencyTotal.innerText = `${totalgco2e.toFixed(2)} gCO2e`;

} 