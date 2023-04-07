'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
// the options in between the select element
const options = [...inputType.children];
const allInputs = document.querySelectorAll('.form__input');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const imgLogo = document.querySelector('.logo');

class Workout {
  date = new Date();
  id = `${+this.date}`.slice(5);
  constructor(coords, distance, duration) {
    this.coords = coords; // array of coords
    this.distance = distance; // in km
    this.duration = duration; // in meters
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
  }
  _calcPace() {
    return (this.pace = +(this.duration / this.distance).toFixed(1));
  }
}

class Cycling extends Workout {
  new;
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
  }
  _calcSpeed() {
    return (this.speed = +(this.distance / this.duration).toFixed(1));
  }
}
class App {
  // private fields
  // storing all the workouts
  #workouts = [];
  // map element
  #map;
  #mapEvent;
  #currentDate = new Date();
  #intl = new Intl.DateTimeFormat(navigator.language, {
    month: 'long',
    day: '2-digit',
  }).format(this.#currentDate);
  constructor() {
    // get current Position
    this._getPosition();
    // toggle the elevation Field when workout is changed
    form.addEventListener('change', this._toggleElevationField);
    form.addEventListener('submit', this._newWorkout.bind(this));
    containerWorkouts.addEventListener('click', this._moveToWorkout.bind(this));
    // loading all workouts from the local Storage
    this._getWorkoutsFromLocalStorage();
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        this._loadMap(position);
      });
    }
  }
  _loadMap(pos) {
    const { latitude, longitude } = pos.coords;
    const coordsArray = [latitude, longitude];
    this.#map = L.map('map').setView(coordsArray, 18);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.#map);
    // creating current Position Marker
    let marker = L.marker(coordsArray).addTo(this.#map);
    marker.bindPopup('<b>Current Position 🗺️</b><br>').openPopup();

    this.#map.on('click', this._showForm.bind(this));

    // rendering all the workout markers including from locacl storage
    this.#workouts.forEach(workout => this._renderWorkoutMarker(workout));
  }
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    const elvationGainRow = inputElevation.closest('.form__row');
    const cadenceRow = inputCadence.closest('.form__row');
    if (inputType.value === 'cycling') {
      elvationGainRow.classList.remove('form__row--hidden');
      cadenceRow.classList.add('form__row--hidden');
    }
    if (inputType.value === 'running') {
      elvationGainRow.classList.add('form__row--hidden');
      cadenceRow.classList.remove('form__row--hidden');
    }
  }
  _newWorkout(e) {
    e.preventDefault();
    let workout;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositives = (...inputs) => inputs.every(input => input > 0);
    const { lat, lng } = this.#mapEvent.latlng;
    const coordsArray = [lat, lng];
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !allPositives(distance, duration, cadence) ||
        !validInputs(distance, duration, cadence)
      )
        return alert('Inputs Must Be Positive');
      workout = new Running(coordsArray, distance, duration, cadence);
    }
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !allPositives(distance, duration) ||
        !validInputs(distance, duration, elevation)
      )
        return alert('Inputs Must Be Positive');

      workout = new Cycling(coordsArray, distance, duration, elevation);
    }
    // pushing the workout to the workouts array
    this.#workouts.push(workout);
    // hiding the form
    this._hideForm();
    // rendering the workout in the list
    form.insertAdjacentHTML('afterend', this._renderWorkout(workout));
    // render out workout marker on the map
    this._renderWorkoutMarker(workout);
    // setting the workout in the local storage
    this._setWorkoutsInLocalStorage(workout);
  }
  _hideForm() {
    form.classList.add('hidden');
    allInputs.forEach(input => {
      if (input.classList.contains('form__input--type')) return;
      input.value = '';
    });
  }
  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">Running on ${this.#intl}</h2>
    <div class="workout__details">
      <span class="workout__icon">${this._workoutComparison(
        workout.type,
        `🏃‍♂️`,
        `🚲`
      )}
      </span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>

    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${
        workout.type === 'running' ? workout._calcPace() : workout._calcSpeed()
      }
      </span>
      <span class="workout__unit">${this._workoutComparison(
        workout.type,
        'min/km',
        'km/h'
      )}
      </span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">${this._workoutComparison(
        workout.type,
        '🦶',
        '🔺'
      )}</span>
      <span class="workout__value">${this._workoutComparison(
        workout.type,
        workout.cadence,
        workout.elevation
      )}
      </span>
      <span class="workout__unit">${this._workoutComparison(
        workout.type,
        'spm',
        'm'
      )}
      </span>
    </div>
  </li>`;
    return html;
  }
  _workoutComparison(workoutName, comparison1, comparison2) {
    return workoutName === 'running' ? comparison1 : comparison2;
  }
  _renderWorkoutMarker(Workout) {
    L.marker(Workout.coords)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${Workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${
          Workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        } ${Workout.type[0].toUpperCase()}${Workout.type.slice(1)} on  ${
          this.#intl
        }`
      )

      .addTo(this.#map)
      .openPopup();
  }
  _moveToWorkout(e) {
    const target = e.target.closest('.workout');
    // guard clause to ensure there is only a click on the workout itself not outside of the workout list
    if (!target) return;
    const targetID = target.dataset.id;
    const targetOBJECT = this.#workouts.find(
      workout => workout.id === targetID
    );
    this.#map.setView(targetOBJECT.coords, 19, {
      animate: true,
      duration: 0.5,
    });
  }
  _setWorkoutsInLocalStorage(workout) {
    localStorage.setItem(`${workout.id}`, JSON.stringify(workout));
  }
  _getWorkoutsFromLocalStorage() {
    const keys = Object.keys(localStorage);
    let WORKOUT;
    keys.forEach(key => {
      const item = localStorage.getItem(key);
      const itemParsed = JSON.parse(item);
      if (itemParsed.type === 'running') {
        WORKOUT = new Running(
          itemParsed.coords,
          itemParsed.distance,
          itemParsed.duration,
          itemParsed.cadence
        );
      }
      if (itemParsed.type === 'cycling') {
        WORKOUT = new Cycling(
          itemParsed.coords,
          itemParsed.distance,
          itemParsed.duration,
          itemParsed.elevation
        );
      }
      this.#workouts.push(WORKOUT);
      form.insertAdjacentHTML('afterend', this._renderWorkout(WORKOUT));
    });
  }
  _resetMap() {
    this.#workouts = [];
    localStorage.clear();
    location.reload();
  }
}
const app = new App();
