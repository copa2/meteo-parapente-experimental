
//
/**
 * Different mathematical calculation for the atmosphere.
 *
 * http://www.fao.org/docrep/x0490e/x0490e07.htm#chapter: Fao meteorological data
 * http://journals.ametsoc.org/doi/pdf/10.1175/1520-0493(1980)108%3C1046%3ATCOEPT%3E2.0.CO%3B2: Bolton
 *
 */
class MeteoMath {

  /**
   * Calcualte Moist Adiabatic Lapse Rate for given pressure and temperature
   *
   * param p   pressure  [hPa]
   * param t   temperatur in celsius
   * return malr  in celsius per meter [C/m] (or Kelvin/meter [K/m])
   */
  static calculateMALR(p,t) {

    // http://www.theweatherprediction.com/habyhints/161/
    // http://www.mit.edu/~pog/src/eff_stat_stab.m
    // and Wikipedia

    var Ws = MeteoMath.saturationMixingRatio(p,t);
    var L = MeteoMath.latentHeatOfCondensation(t);
    var T = MeteoMath.toKelvin(t)

    // From Wikipedia
    var malr = MeteoMath.g * ((1+ (L * Ws / (MeteoMath.Rd * T) )) /
              (MeteoMath.cpd + (Math.pow(L,2) * Ws * (MeteoMath.Rd/MeteoMath.Rv)) / (MeteoMath.Rd * Math.pow(T,2)) ) );
    return malr;
    // malr is Celsius/Kelvin per meter [K/m]
  }

  // t=celsius
  static latentHeatOfCondensation(t) {
    //var L = 2453000; // 2.453 × 10^6 J/kg
    //var L = 2501000; // Wikipeadia
    var L = (2.501-0.00237*t)*1e6; // Bolton (2)
    return L;
  }

  /**
   * Calulate saturation mixing ration from pressure and temperature
   * param p pressure [hpa]
   * param t temperature in celsius
   * return ws in g/kg
   */
  static saturationMixingRatio(p,t) {
    // ratio molecular weight of water vapour/dry air = 0.622
    var rr = 0.622; // MeteoMath.Rd/MeteoMath.Rv
    var Es = MeteoMath.saturationVaporPressure(t);
    // saturation mixing ratio
    var Ws = rr * Es / (p - Es);
    return Ws;
  }

  /**
   * Calcualte staturation vapor pressure for a temparature
   * param t    temperature in Celsius
   * return saturatoin vapor pressure [hpa]
   */
  static saturationVaporPressure(t) {
    var Es = 6.112*Math.exp(17.67*t/(t+243.5));   // Bolton (10)
    return Es;
  }

  /**
   * Calulate saturation mixing ratio from pressure and ws [g/kg]
   * param p pressure [hpa]
   * param ws [g/kg]
   * return temperature in c
   */
  static saturationMixingRatioTemperature(p,ws) {
    var wskgkg = ws/1000;  // g/kg to kg/kg
    var rr = 0.622; // MeteoMath.Rd/MeteoMath.Rv
    var es = (wskgkg*p) / (rr+wskgkg);

    // saturation vapor pressure
    var t = MeteoMath.saturationVaporTemperature(es);
    return t;
  }

  /**
   * Calcualte saturation vapor temperature from saturation vapor pressure
   * param es  saturation vapor pressure [hpa]
   * return temperature in celsius
   */
  static saturationVaporTemperature(es) {
    // Bolton (11)
    let t = (243.5*Math.log(es)-440.8) / (19.48-Math.log(es));
    return t;
  }



  /**
   * Calculate potential temperature for pressure[hpa] and temperature[c].
   * theta = t*(p0/p)^0.286
   * param p pressure [hPa]
   * param t temperature in celsius
   * return potential temperature in celsius
   */
  static potentialTemperature(p,t) {
    const p0 = 1000; // 1000hPa ~= 111m
    var TK = MeteoMath.toKelvin(t);
    return MeteoMath.toCelsius(TK*Math.pow(1000/p, 0.286));
  }

  /**
   * Convert altitude in meters to pressure [hpa]
   * param alt  altitude in meters
   * return pressure in [hpa]]
   */
  static altitudeToPressure(alt) {
    // http://www.engineeringtoolbox.com/air-altitude-pressure-d_462.html
    var p = MeteoMath.pressureSL* Math.pow((1 - 2.25577 * Math.pow(10,-5) * alt), 5.25588 );
    // or http://www.fao.org/docrep/x0490e/x0490e07.htm#atmospheric pressure (p)
    //var p = MeteoMath.pressureSL* Math.pow((293-0.0065*alt)/293, 5.26);
    return p;
  }
  /**
   * Convert pressure [hPa] to altitude in meters
   */
  static pressureToAltitude(press) {
    var alt = (288.15/0.0065)*(1-Math.pow(press/MeteoMath.pressureSL, 1/5.255));
    return alt;
  }

  // from celsius to kelvin
  static toKelvin(tc) {
    return tc+MeteoMath.TK_0;
  }
  // from kelvin to celsius
  static toCelsius(tk) {
    return tk-MeteoMath.TK_0;
  }
}

// Consts from D.Bolton "The Computation of Equavialent Potential Temperature"

MeteoMath.Rd       = 287.04;      // gas constant of dry air [J/kg/K]
MeteoMath.Rv       = 461.5;       // gas constant of water vapor(moist air) [J/kg/K]
MeteoMath.cpd      = 1005.7;      // specific heat dry air [J/kg/K]m +-2.5
MeteoMath.cpv      = 1875;        // specific heat water vapor [J/kg/K] +- 30

MeteoMath.g        = 9.80665 ;    // [m/s^2]
MeteoMath.pressureSL = 1013.25;    // Pressure at sea level [hPa]
MeteoMath.TK_0 = 273.15;          // Kelvin at 0° Celsius
