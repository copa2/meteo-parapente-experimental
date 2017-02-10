## Experimental meteo-parapente

Experimental implementation of meteo-parapente, so that it should
be easier to use on a mobile phone.

Meteo-Parapente is used for showing weather information for gliders.
It calculates WRF-ARW model and provides this data.

All data is provided by https://meteo-parapente.com.

**IMPORATANT:** This is a experiment and works as long as meteo-parapente
is providing its data free and in the same format.
Its meant to experiment with data which is provided from meteo-parapente.

It has some missing futures like:
* Arome data

#### TODO
* Legend
 * Gradient
 * Text on scale / sized for available place(width)
 * onClickLegend change scale (km/h -> m/s)
 * width adapting to map size
 * experiment with vertical instead of horizontal
* WindAlti
 * next 3 Days
 * onClick data (wind,pblh/wstar,clouds)
* Sounding
 * Change hours
* Meteogramm
* i18n
* ThermalIndicator in Timeslider (calculate on rain,cloud,wind,bldepth for visible region/center)

#### Licence
Code licenced MIT.
