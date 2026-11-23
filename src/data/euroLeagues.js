// THE REST OF EUROPE, AND AUSTRALIA.
//
// Every league below came in at once, from the list of leagues the game was
// missing: the second and third tiers in Sweden and Finland, the junior and
// under-18 tiers that feed them, Denmark, Norway, the Swiss League, DEL2, the
// Alps Hockey League, the Ligue Magnus, the EIHL, the VHL and the MHL, and the
// AIHL. Each one is a row in EXTRA_LEAGUES with its own teams, and data/teams.js
// folds them into LEAGUE_CONFIG, the opponent pools and the rest, so a league is
// added here and nowhere else.
//
// The crests come from the same logo pack as every other club in the game.
// Where a club's own junior crest exists it's used; otherwise the junior side
// carries the senior crest. A club's two colours were read off its crest.
//
// This file is generated from a spec and a logo match; edit the data here.

const T = 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_teams/';
const LG = 'https://raw.githubusercontent.com/JacobC6799/FHM12-Logo-Pack/main/quickstart_games/OpeningDay.quick/graphics/logo_leagues/';

// HockeyAllsvenskan
export const allsvTeams = [
  { id: 'AIK', city: 'AIK', name: 'Hockey', bg: '#013155', color: '#69722C', logo: T + 'aik.png' },
  { id: 'ALM', city: 'Almtuna', name: 'IS', bg: '#DC002E', color: '#FCE600', rival: 'VIK', logo: T + 'almtuna_is.png' },
  { id: 'BIK', city: 'BIK', name: 'Karlskoga', bg: '#1A6BB0', color: '#FFFFFF', logo: T + 'bik_karlskoga.png' },
  { id: 'IKO', city: 'IK', name: 'Oskarshamn', bg: '#1F5287', color: '#949FB8', rival: 'KHC', logo: T + 'ik_oskarshamn.png' },
  { id: 'KHC', city: 'Kalmar', name: 'HC', bg: '#E0032D', color: '#C88368', rival: 'NYB', logo: T + 'kalmar_hc.png' },
  { id: 'LIF', city: 'Leksands', name: 'IF', bg: '#232F64', color: '#FFFFFF', rival: 'MORA', logo: T + 'leksands_if.png' },
  { id: 'MODO', city: 'MoDo', name: 'Hockey', bg: '#E5292E', color: '#4A3B34', rival: 'OIK', logo: T + 'modo_hockey.png' },
  { id: 'MORA', city: 'Mora', name: 'IK', bg: '#E41518', color: '#EC9E0B', rival: 'LIF', logo: T + 'mora_ik.png' },
  { id: 'NYB', city: 'Nybro', name: 'Vikings', bg: '#3F1616', color: '#B34141', rival: 'KHC', logo: T + 'nybro_vikings_if.png' },
  { id: 'SSK', city: 'Södertälje', name: 'SK', bg: '#B69F68', color: '#1666B0', rival: 'AIK', logo: T + 's%C3%B6dert%C3%A4lje_sk.png' },
  { id: 'VIM', city: 'Vimmerby', name: 'HC', bg: '#4D361C', color: '#FFFFFF', rival: 'IKO', logo: T + 'vimmerby_hc.png' },
  { id: 'VRH', city: 'Visby/Roma', name: 'HK', bg: '#866C2A', color: '#B6ADAF', logo: T + 'visby_roma_hk.png' },
  { id: 'VIK', city: 'Västerås', name: 'IK', bg: '#000000', color: '#F2D200', rival: 'ALM', logo: T + 'vik_v%C3%A4ster%C3%A5s_hk.png' },
  { id: 'OIK', city: 'Östersunds', name: 'IK', bg: '#FFFF01', color: '#0B2011', rival: 'MODO', logo: T + '%C3%B6stersunds_ik.png' }
];

// Hockeyettan
export const ettanTeams = [
  { id: 'ASP', city: 'Asplöven', name: 'HC', bg: '#232021', color: '#EA1A20', conf: 'North', logo: T + 'aspl%C3%B6ven_hc.png' },
  { id: 'BOD', city: 'Bodens', name: 'HF', bg: '#000000', color: '#70696A', rival: 'PHC', conf: 'North', logo: T + 'bodens_hf.png' },
  { id: 'BHF', city: 'Borlänge', name: 'HF', bg: '#2D2135', color: '#EEE5C8', conf: 'North', logo: T + 'borl%C3%A4nge_hf.png' },
  { id: 'ESK', city: 'Enköpings', name: 'SK', bg: '#205F30', color: '#7B9E75', conf: 'North', logo: T + 'enk%C3%B6pings_sk.png' },
  { id: 'HHC', city: 'Hudiksvalls', name: 'HC', bg: '#C20210', color: '#572927', conf: 'North', logo: T + 'hudiksvalls_hc.png' },
  { id: 'JHC', city: 'Järfälla', name: 'HC', bg: '#E30043', color: '#6E5891', conf: 'North', logo: T + 'j%C3%A4rf%C3%A4lla_hc.png' },
  { id: 'KLX', city: 'Kalix', name: 'HC', bg: '#D01518', color: '#FFFFFF', rival: 'BOD', conf: 'North', logo: T + 'kalix_hc.png' },
  { id: 'KIR', city: 'Kiruna', name: 'IF', bg: '#536886', color: '#FFFFFF', conf: 'North', logo: T + 'kiruna_if.png' },
  { id: 'LLV', city: 'Lindlövens', name: 'IF', bg: '#CFB7A7', color: '#FFFFFF', conf: 'North', logo: T + 'lindl%C3%B6vens_if.png' },
  { id: 'NIK', city: 'Norrtälje', name: 'IK', bg: '#1F2937', color: '#FFFFFF', conf: 'North', logo: '' },
  { id: 'PHC', city: 'Piteå', name: 'HC', bg: '#2C2021', color: '#FFFFFF', rival: 'BOD', conf: 'North', logo: T + 'pite%C3%A5_hc.png' },
  { id: 'SOL', city: 'Sollentuna', name: 'HC', bg: '#6E1929', color: '#C59398', conf: 'North', logo: T + 'sollentuna_hc.png' },
  { id: 'STB', city: 'Strömsbro', name: 'IF', bg: '#1F2937', color: '#FFFFFF', conf: 'North', logo: T + 'str%C3%B6msbro_if.png' },
  { id: 'SUN', city: 'IF Sundsvall', name: 'Hockey', bg: '#B5A253', color: '#6A6A5F', conf: 'North', logo: T + 'if_sundsvall.png' },
  { id: 'SUR', city: 'Surahammars', name: 'IF', bg: '#0030E0', color: '#FFFFFF', conf: 'North', logo: T + 'surahammars_if.png' },
  { id: 'VLT', city: 'Vallentuna', name: 'Hockey', bg: '#242021', color: '#A92427', conf: 'North', logo: T + 'vallentuna_bk.png' },
  { id: 'VAS', city: 'Väsby', name: 'IK', bg: '#1E734B', color: '#FFFFFF', conf: 'North', logo: T + 'v%C3%A4sby_ik.png' },
  { id: 'WHC', city: 'Wings HC', name: 'Arlanda', bg: '#031A50', color: '#9D976C', conf: 'North', logo: T + 'wings_hc_arlanda.png' },
  { id: 'OHF', city: 'Örnsköldsvik', name: 'HF', bg: '#9097AA', color: '#25395F', conf: 'North', logo: T + '%C3%B6rnsk%C3%B6ldsvik_hf.png' },
  { id: 'BVH', city: 'Boro/Vetlanda', name: 'HC', bg: '#453580', color: '#FFFFFF', conf: 'South', logo: T + 'boro_vetlanda.png' },
  { id: 'BOR', city: 'Borås', name: 'HC', bg: '#12295A', color: '#A0A8B4', conf: 'South', logo: T + 'bor%C3%A5s_hc.png' },
  { id: 'DAL', city: 'HC', name: 'Dalen', bg: '#151218', color: '#D43C1A', conf: 'South', logo: T + 'hc_dalen_j20.png' },
  { id: 'GRU', city: 'Grums', name: 'IK', bg: '#303591', color: '#A18A6B', conf: 'South', logo: T + 'grums_ik.png' },
  { id: 'GRA', city: 'Grästorps', name: 'IK', bg: '#1C1819', color: '#ED1A24', conf: 'South', logo: T + 'gr%C3%A4storps_ik.png' },
  { id: 'VHA', city: 'HC', name: 'Vita Hästen', bg: '#C31F26', color: '#EFEDED', conf: 'South', logo: T + 'hc_vita_h%C3%A4sten.png' },
  { id: 'HAL', city: 'Halmstad', name: 'Hammers', bg: '#2E3646', color: '#68606A', conf: 'South', logo: T + 'halmstad_hammers_hc.png' },
  { id: 'HAN', city: 'Hanvikens', name: 'SK', bg: '#FDF002', color: '#E52B38', conf: 'South', logo: T + 'tyres%C3%B6_hanviken.png' },
  { id: 'HUD', city: 'Huddinge', name: 'IK', bg: '#242A76', color: '#C194A6', conf: 'South', logo: T + 'huddinge_ik.png' },
  { id: 'KHK', city: 'Karlskrona', name: 'HK', bg: '#E26A24', color: '#47362F', conf: 'South', logo: T + 'karlskrona_hk.png' },
  { id: 'KUN', city: 'Kungälvs', name: 'IK', bg: '#FB2222', color: '#312B2B', conf: 'South', logo: T + 'kung%C3%A4lvs_ik.png' },
  { id: 'MAR', city: 'Mariestad', name: 'BoIS', bg: '#DA241D', color: '#B0AA10', conf: 'South', logo: T + 'mariestad_bois.png' },
  { id: 'MJO', city: 'Mjölby', name: 'HC', bg: '#100E0E', color: '#9E3839', conf: 'South', logo: T + 'mj%C3%B6lby_hc.png' },
  { id: 'MRM', city: 'Mörrums', name: 'GoIS', bg: '#3A2C55', color: '#FFFFFF', conf: 'South', logo: T + 'm%C3%B6rrums_gois.png' },
  { id: 'NSK', city: 'Nyköpings', name: 'SK', bg: '#060202', color: '#B71106', conf: 'South', logo: T + 'nyk%C3%B6pings_sk.png' },
  { id: 'TAIF', city: 'Tingsryds', name: 'AIF', bg: '#75A093', color: '#FFFFFF', conf: 'South', logo: T + 'tingsryds_aif.png' },
  { id: 'TRA', city: 'Tranås', name: 'AIF', bg: '#040204', color: '#D8D9D8', conf: 'South', logo: T + 'tran%C3%A5s_aif.png' },
  { id: 'TRO', city: 'IF', name: 'Troja-Ljungby', bg: '#DC3135', color: '#FFFFFF', conf: 'South', logo: T + 'if_troja-ljungby.png' },
  { id: 'TYR', city: 'IK Tyringe', name: 'SoSS', bg: '#C8081A', color: '#102C71', conf: 'South', logo: T + 'tyringe_soss.png' },
  { id: 'VVIK', city: 'Västerviks', name: 'IK', bg: '#E91F27', color: '#F6CAC3', conf: 'South', logo: T + 'v%C3%A4sterviks_ik.png' }
];

// U18 Nationell
export const j18Teams = [
  { id: 'LHF-J18', city: 'Luleå', name: 'HF J18', bg: '#000000', color: '#D7070F', conf: 'North', seniorId: 'LHF', logo: T + 'lule%C3%A5_hf_j18.png' },
  { id: 'SAIK-J18', city: 'Skellefteå', name: 'AIK J18', bg: '#FFB10F', color: '#AA790E', conf: 'North', seniorId: 'SAIK', logo: T + 'skellefte%C3%A5_aik_j18.png' },
  { id: 'BJO-J18', city: 'IF', name: 'Björklöven J18', bg: '#17663D', color: '#87A858', conf: 'North', seniorId: 'BJO', logo: T + 'if_bj%C3%B6rkl%C3%B6ven_j18.png' },
  { id: 'TIK-J18', city: 'Timrå', name: 'IK J18', bg: '#893953', color: '#FFFFFF', conf: 'North', seniorId: 'TIK', logo: T + 'timr%C3%A5_ik_j18.png' },
  { id: 'MODO-J18', city: 'MoDo', name: 'Hockey J18', bg: '#48372F', color: '#B4BEB3', conf: 'North', seniorId: 'MODO', logo: T + 'modo_hockey_j18.png' },
  { id: 'OIK-J18', city: 'Östersunds', name: 'IK J18', bg: '#FFFF01', color: '#0B2011', conf: 'North', seniorId: 'OIK', logo: T + '%C3%B6stersunds_ik_j18.png' },
  { id: 'BIF-J18', city: 'Brynäs', name: 'IF J18', bg: '#CCB337', color: '#060405', conf: 'North', seniorId: 'BIF', logo: T + 'bryn%C3%A4s_if_j18.png' },
  { id: 'LIF-J18', city: 'Leksands', name: 'IF J18', bg: '#054392', color: '#FFFFFF', conf: 'North', seniorId: 'LIF', logo: T + 'leksands_if_j18.png' },
  { id: 'MORA-J18', city: 'Mora', name: 'IK J18', bg: '#349523', color: '#E70000', conf: 'North', seniorId: 'MORA', logo: T + 'mora_ik_j18.png' },
  { id: 'AIK-J18', city: 'AIK', name: 'Stockholm J18', bg: '#737430', color: '#013155', conf: 'North', seniorId: 'AIK', logo: T + 'aik_j18.png' },
  { id: 'DIF-J18', city: 'Djurgårdens', name: 'IF J18', bg: '#9A8A53', color: '#2A64AB', conf: 'North', seniorId: 'DIF', logo: T + 'djurg%C3%A5rdens_if_j18.png' },
  { id: 'SSK-J18', city: 'Södertälje', name: 'SK J18', bg: '#002653', color: '#016FBB', conf: 'North', seniorId: 'SSK', logo: T + 's%C3%B6dert%C3%A4lje_sk_j18.png' },
  { id: 'ALM-J18', city: 'Almtuna', name: 'IS J18', bg: '#DC002D', color: '#FDEA00', conf: 'North', seniorId: 'ALM', logo: T + 'almtuna_is_j18.png' },
  { id: 'FBK-J18', city: 'Färjestad', name: 'BK J18', bg: '#009C5F', color: '#FDD324', conf: 'South', seniorId: 'FBK', logo: T + 'f%C3%A4rjestads_bk_j18.png' },
  { id: 'FHC-J18', city: 'Frölunda', name: 'HC J18', bg: '#0D1712', color: '#586B5B', conf: 'South', seniorId: 'FHC', logo: T + 'fr%C3%B6lunda_hc_j18.png' },
  { id: 'HV71-J18', city: 'HV71', name: 'Jönköping J18', bg: '#F2D643', color: '#02367A', conf: 'South', seniorId: 'HV71', logo: T + 'hv71_j18.png' },
  { id: 'LHC-J18', city: 'Linköping', name: 'HC J18', bg: '#742049', color: '#DBDADE', conf: 'South', seniorId: 'LHC', logo: T + 'link%C3%B6ping_hc_j18.png' },
  { id: 'VHK-J18', city: 'Växjö', name: 'Lakers J18', bg: '#EA7337', color: '#D2A46B', conf: 'South', seniorId: 'VHK', logo: T + 'v%C3%A4xj%C3%B6_lakers_hc_j18.png' },
  { id: 'RBK-J18', city: 'Rögle', name: 'BK J18', bg: '#00C700', color: '#FFFFFF', conf: 'South', seniorId: 'RBK', logo: T + 'r%C3%B6gle_bk_j18.png' },
  { id: 'MIF-J18', city: 'Malmö', name: 'Redhawks J18', bg: '#EB0000', color: '#020000', conf: 'South', seniorId: 'MIF', logo: T + 'if_malm%C3%B6_redhawks_j18.png' },
  { id: 'OHK-J18', city: 'Örebro', name: 'HK J18', bg: '#DE1633', color: '#342528', conf: 'South', seniorId: 'OHK', logo: T + '%C3%B6rebro_hk_j18.png' },
  { id: 'IKO-J18', city: 'IK', name: 'Oskarshamn J18', bg: '#01478B', color: '#E71B30', conf: 'South', seniorId: 'IKO', logo: T + 'ik_oskarshamn_j18.png' },
  { id: 'VIK-J18', city: 'Västerås', name: 'IK J18', bg: '#000000', color: '#FEDE00', conf: 'South', seniorId: 'VIK', logo: T + 'v%C3%A4ster%C3%A5s_j18.png' },
  { id: 'BIK-J18', city: 'BIK', name: 'Karlskoga J18', bg: '#086AB5', color: '#FFFFFF', conf: 'South', seniorId: 'BIK', logo: T + 'bik_karlskoga_j18.png' }
];

// Mestis
export const mestisTeams = [
  { id: 'HER', city: 'Hermes', name: 'Kokkola', bg: '#0A1857', color: '#757C9E', logo: T + 'kokkola_hermes.png' },
  { id: 'IPK', city: 'IPK', name: 'Iisalmi', bg: '#070709', color: '#FFFFFF', rival: 'JOKP', logo: T + 'iisalmi_ipk.png' },
  { id: 'JOKP', city: 'JoKP', name: 'Joensuu', bg: '#981723', color: '#FFFFFF', rival: 'IPK', logo: T + 'joensuu_jokipojat.png' },
  { id: 'KET', city: 'Ketterä', name: 'Imatra', bg: '#F70000', color: '#FFFFFF', logo: T + 'imatra_ketter%C3%A4.png' },
  { id: 'KEU', city: 'KeuPa HT', name: 'Keuruu', bg: '#114E78', color: '#E80309', logo: T + 'keuruu_keupa_ht.png' },
  { id: 'KVA', city: 'Kiekko-Vantaa', name: 'Vantaa', bg: '#231E1F', color: '#5D799D', logo: T + 'kiekko-vantaa.png' },
  { id: 'PYR', city: 'Pyry', name: 'Nokia', bg: '#242021', color: '#EF2F24', logo: T + 'nokia_pyry.png' },
  { id: 'ROK', city: 'RoKi', name: 'Rovaniemi', bg: '#0F141F', color: '#FEFFFE', logo: T + 'rovaniemi_roki.png' },
  { id: 'TUTO', city: 'TUTO', name: 'Turku', bg: '#054194', color: '#D4061C', logo: T + 'turku_tuto.png' }
];

// Suomi-sarja
export const suomiTeams = [
  { id: 'SAPK', city: 'SaPKo', name: 'Savonlinna', bg: '#D20323', color: '#FFFFFF', logo: T + 'savonlinna_sapko.png' },
  { id: 'SKI', city: 'S-Kiekko', name: 'Seinäjoki', bg: '#0073BD', color: '#57262F', logo: T + 'sein%C3%A4joki_s-kiekko.png' },
  { id: 'MUIK', city: 'Muik Hockey', name: 'Joensuu', bg: '#00153D', color: '#6C6E87', logo: T + 'nykarleby_muik_hockey.png' },
  { id: 'LAS', city: 'Laser HT', name: 'Oulu', bg: '#D00A36', color: '#C3C2D0', logo: T + 'oulu_laser_ht.png' },
  { id: 'HUN', city: 'Hunters', name: 'Pirkkala', bg: '#EA2C28', color: '#7B6B77', logo: T + 'porvoo_hunters.png' },
  { id: 'VIR', city: 'Virkiä', name: 'Lapua', bg: '#00569C', color: '#FFFFFF', logo: T + 'lapua_virki%C3%A4.png' },
  { id: 'JHT', city: 'JHT', name: 'Kalajoki', bg: '#CF2016', color: '#C2C1C7', logo: T + 'kalajoki_jht.png' },
  { id: 'RAA', city: 'Raahe-Kiekko', name: 'Raahe', bg: '#D71920', color: '#C4AFAC', logo: T + 'raahe-kiekko.png' },
  { id: 'URH', city: 'Urho', name: 'Kotka', bg: '#1D469C', color: '#FFFFFF', logo: T + 'suolahti_urho.png' },
  { id: 'RIE', city: 'Riemu', name: 'Rovaniemi', bg: '#091218', color: '#488993', logo: T + 'jyv%C3%A4skyl%C3%A4_riemu.png' },
  { id: 'LEKI', city: 'LeKi', name: 'Lempäälä', bg: '#223E5B', color: '#7392B4', logo: T + 'lemp%C3%A4%C3%A4l%C3%A4_leki.png' },
  { id: 'KOOV', city: 'KOOVEE', name: 'Tampere', bg: '#FDB019', color: '#EF3352', logo: T + 'tampere_koovee.png' }
];

// U20 Mestis
export const u20mTeams = [
  { id: 'AKH-U20M', city: 'Kiekko-Espoo', name: 'Espoo U20', bg: '#003DA5', color: '#F7AD0E', seniorId: 'AKH', logo: T + 'kiekko-espoo_a.png' },
  { id: 'KVA-U20M', city: 'Kiekko-Vantaa', name: 'Vantaa U20', bg: '#201C1C', color: '#B6A186', seniorId: 'KVA', logo: T + 'kiekko-vantaa_a.png' },
  { id: 'TUTO-U20M', city: 'TUTO', name: 'Turku U20', bg: '#3D48A2', color: '#DB1A21', seniorId: 'TUTO', logo: T + 'turku_tuto_2_a.png' },
  { id: 'JOKP-U20M', city: 'JoKP', name: 'Joensuu U20', bg: '#391C1F', color: '#FFFFFF', seniorId: 'JOKP', logo: T + 'joensuu_jokipojat_a.png' },
  { id: 'IPK-U20M', city: 'IPK', name: 'Iisalmi U20', bg: '#070709', color: '#FFFFFF', seniorId: 'IPK', logo: T + 'iisalmi_ipk.png' },
  { id: 'KET-U20M', city: 'Ketterä', name: 'Imatra U20', bg: '#F70000', color: '#FFFFFF', seniorId: 'KET', logo: T + 'imatra_ketter%C3%A4_a.png' },
  { id: 'KJT-U20M', city: 'KJT Haukat', name: 'Järvenpää U20', bg: '#10133D', color: '#F55F3F', seniorId: 'KJT', logo: T + 'j%C3%A4rvenp%C3%A4%C3%A4_kjt-haukat_a.png' },
  { id: 'SAPK-U20M', city: 'SaPKo', name: 'Savonlinna U20', bg: '#BA303A', color: '#FFFFFF', seniorId: 'SAPK', logo: T + 'savonlinna_sapko_a.png' },
  { id: 'HER-U20M', city: 'Hermes', name: 'Kokkola U20', bg: '#0A1857', color: '#717799', seniorId: 'HER', logo: T + 'kokkola_hermes_a.png' },
  { id: 'JYPA-U20M', city: 'JYP Akatemia', name: 'Jyväskylä U20', bg: '#ED1C24', color: '#716A6C', seniorId: 'JYPA', logo: T + 'jyv%C3%A4skyl%C3%A4_jyp_a.png' },
  { id: 'VIIK-U20M', city: 'Viikingit', name: 'Vaasa U20', bg: '#0000E6', color: '#FE0102', seniorId: 'VIIK', logo: T + 'helsinki_viikingit_a.png' },
  { id: 'LAS-U20M', city: 'Laser HT', name: 'Oulu U20', bg: '#2E2F60', color: '#BE4B42', seniorId: 'LAS', logo: T + 'oulu_kiekko-laser_kkp_a.png' },
  { id: 'KOOV-U20M', city: 'KOOVEE', name: 'Tampere U20', bg: '#525442', color: '#D52B0F', seniorId: 'KOOV', logo: T + 'tampere_koovee_a.png' },
  { id: 'LEKI-U20M', city: 'LeKi', name: 'Lempäälä U20', bg: '#29405B', color: '#7992B2', seniorId: 'LEKI', logo: T + 'lemp%C3%A4%C3%A4l%C3%A4_leki_a.png' }
];

// U18 SM-sarja
export const u18Teams = [
  { id: 'TAP-U18', city: 'Tappara', name: 'Tampere U18', bg: '#0C2576', color: '#D45F21', seniorId: 'TAP', logo: T + 'tampere_tappara_b.png' },
  { id: 'ILK-U18', city: 'Ilves', name: 'Tampere U18', bg: '#FACF0E', color: '#2F2B24', seniorId: 'ILK', logo: T + 'tampere_ilves_b.png' },
  { id: 'HIFK-U18', city: 'HIFK', name: 'Helsinki U18', bg: '#082F76', color: '#DC1F30', seniorId: 'HIFK', logo: T + 'helsinki_hifk_b.png' },
  { id: 'JOK-U18', city: 'Jokerit', name: 'Helsinki U18', bg: '#1F2937', color: '#FFFFFF', seniorId: 'JOK', logo: T + 'helsinki_jokerit_b.png' },
  { id: 'KAR-U18', city: 'Kärpät', name: 'Oulu U18', bg: '#131A1C', color: '#838162', seniorId: 'KAR', logo: T + 'oulu_k%C3%A4rp%C3%A4t_b.png' },
  { id: 'TPS-U18', city: 'TPS', name: 'Turku U18', bg: '#000000', color: '#969696', seniorId: 'TPS', logo: T + 'turku_tps_b.png' },
  { id: 'LUK-U18', city: 'Lukko', name: 'Rauma U18', bg: '#0055A5', color: '#FFFFFF', seniorId: 'LUK', logo: T + 'rauma_lukko_b.png' },
  { id: 'KAL-U18', city: 'KalPa', name: 'Kuopio U18', bg: '#DBA968', color: '#1D1D1B', seniorId: 'KAL', logo: T + 'kuopio_kalpa_b.png' },
  { id: 'PEL-U18', city: 'Pelicans', name: 'Lahti U18', bg: '#52C1EB', color: '#2F3B52', seniorId: 'PEL', logo: T + 'lahti_pelicans_b.png' },
  { id: 'KOO-U18', city: 'KooKoo', name: 'Kouvola U18', bg: '#B25E2A', color: '#231F20', seniorId: 'KOO', logo: T + 'kouvola_kookoo_b.png' },
  { id: 'HPK-U18', city: 'HPK', name: 'Hämeenlinna U18', bg: '#000000', color: '#D07338', seniorId: 'HPK', logo: T + 'h%C3%A4meenlinna_hpk_b.png' },
  { id: 'JYP-U18', city: 'JYP', name: 'Jyväskylä U18', bg: '#ED1C24', color: '#716A6C', seniorId: 'JYP', logo: T + 'jyv%C3%A4skyl%C3%A4_jyp_b.png' },
  { id: 'SAI-U18', city: 'SaiPa', name: 'Lappeenranta U18', bg: '#FFF700', color: '#131312', seniorId: 'SAI', logo: T + 'lappeenranta_saipa_b.png' },
  { id: 'JUK-U18', city: 'Jukurit', name: 'Mikkeli U18', bg: '#003471', color: '#FEFEFF', seniorId: 'JUK', logo: T + 'mikkeli_jukurit_b.png' },
  { id: 'SPO-U18', city: 'Sport', name: 'Vaasa U18', bg: '#201E21', color: '#FFFFFF', seniorId: 'SPO', logo: T + 'vaasa_sport_b.png' },
  { id: 'ASS-U18', city: 'Ässät', name: 'Pori U18', bg: '#D81A33', color: '#181D1F', seniorId: 'ASS', logo: T + 'pori_%C3%A4ss%C3%A4t_b.png' },
  { id: 'AKH-U18', city: 'Kiekko-Espoo', name: 'Espoo U18', bg: '#003DA5', color: '#F7AD0E', seniorId: 'AKH', logo: T + 'kiekko-espoo_b.png' }
];

// U18 Mestis
export const u18mTeams = [
  { id: 'HER-U18M', city: 'Hermes', name: 'Kokkola U18', bg: '#0A1857', color: '#717799', seniorId: 'HER', logo: T + 'kokkola_hermes_b.png' },
  { id: 'IPK-U18M', city: 'IPK', name: 'Iisalmi U18', bg: '#070709', color: '#FFFFFF', seniorId: 'IPK', logo: T + 'iisalmi_ipk.png' },
  { id: 'JOKP-U18M', city: 'JoKP', name: 'Joensuu U18', bg: '#88162A', color: '#444246', seniorId: 'JOKP', logo: T + 'joensuu_jokipojat_b.png' },
  { id: 'KET-U18M', city: 'Ketterä', name: 'Imatra U18', bg: '#F70000', color: '#FFFFFF', seniorId: 'KET', logo: T + 'imatra_ketter%C3%A4.png' },
  { id: 'KEU-U18M', city: 'KeuPa HT', name: 'Keuruu U18', bg: '#114E78', color: '#E80309', seniorId: 'KEU', logo: T + 'keuruu_keupa_ht.png' },
  { id: 'KVA-U18M', city: 'Kiekko-Vantaa', name: 'Vantaa U18', bg: '#201C1C', color: '#B6A186', seniorId: 'KVA', logo: T + 'kiekko-vantaa_b.png' },
  { id: 'ROK-U18M', city: 'RoKi', name: 'Rovaniemi U18', bg: '#0A0F17', color: '#FFFFFF', seniorId: 'ROK', logo: T + 'rovaniemi_roki_b.png' },
  { id: 'TUTO-U18M', city: 'TUTO', name: 'Turku U18', bg: '#3D48A2', color: '#DB1A21', seniorId: 'TUTO', logo: T + 'turku_tuto_b.png' },
  { id: 'SAPK-U18M', city: 'SaPKo', name: 'Savonlinna U18', bg: '#BA303A', color: '#FFFFFF', seniorId: 'SAPK', logo: T + 'savonlinna_sapko_b.png' },
  { id: 'LAS-U18M', city: 'Laser HT', name: 'Oulu U18', bg: '#2E2F60', color: '#BE4B42', seniorId: 'LAS', logo: T + 'oulu_kiekko-laser_kkp_b.png' },
  { id: 'KOOV-U18M', city: 'KOOVEE', name: 'Tampere U18', bg: '#525442', color: '#D52B0F', seniorId: 'KOOV', logo: T + 'tampere_koovee_b.png' },
  { id: 'LEKI-U18M', city: 'LeKi', name: 'Lempäälä U18', bg: '#29405B', color: '#7992B2', seniorId: 'LEKI', logo: T + 'lemp%C3%A4%C3%A4l%C3%A4_leki_b.png' }
];

// Metal Ligaen
export const metalTeams = [
  { id: 'AAL', city: 'Aalborg', name: 'Pirates', bg: '#061C32', color: '#861D2F', rival: 'FWH', logo: T + 'aalborg_pirates.png' },
  { id: 'ESB', city: 'Esbjerg', name: 'Energy', bg: '#222F50', color: '#FFCA34', rival: 'SON', logo: T + 'esbjerg_energy.png' },
  { id: 'FWH', city: 'Frederikshavn', name: 'White Hawks', bg: '#2E232A', color: '#976542', rival: 'AAL', logo: T + 'frederikshavn_white_hawks.png' },
  { id: 'HLV', city: 'Herlev', name: 'Eagles', bg: '#231F20', color: '#CAB047', rival: 'RUN', logo: T + 'herlev_eagles.png' },
  { id: 'HBF', city: 'Herning', name: 'Blue Fox', bg: '#1F2937', color: '#FFFFFF', rival: 'ESB', logo: T + 'herning_blue_fox.png' },
  { id: 'ODB', city: 'Odense', name: 'Bulldogs', bg: '#16301F', color: '#B76A33', logo: T + 'odense_bulldogs.png' },
  { id: 'RMB', city: 'Rødovre', name: 'Mighty Bulls', bg: '#110B13', color: '#6D5559', rival: 'HLV', logo: T + 'r%C3%B8dovre_mighty_bulls.png' },
  { id: 'RUN', city: 'Rungsted', name: 'Seier Capital', bg: '#034284', color: '#B32D48', rival: 'HLV', logo: T + 'rungsted_ishockey.png' },
  { id: 'SON', city: 'SønderjyskE', name: 'Vojens', bg: '#374484', color: '#FFFFFF', rival: 'ESB', logo: T + 's%C3%B8nderjyske_ishockey.png' }
];

// Danish 1st Division
export const den1Teams = [
  { id: 'AAL-D1', city: 'Aalborg', name: 'IK', bg: '#DA251D', color: '#FFFFFF', logo: T + 'aalborg_ik.png' },
  { id: 'ESB-D1', city: 'Esbjerg', name: 'IK', bg: '#0049FF', color: '#FDFEE7', logo: T + 'esbjerg_ik.png' },
  { id: 'FWH-D1', city: 'Frederikshavn', name: 'IK', bg: '#2E232A', color: '#976542', logo: T + 'frederikshavn_ik.png' },
  { id: 'GEN-D1', city: 'Gentofte', name: 'Stars', bg: '#FF4B00', color: '#B7A09C', logo: T + 'gentofte_stars.png' },
  { id: 'HLV-D1', city: 'Herlev', name: 'IK', bg: '#231F20', color: '#CAB047', logo: T + 'herlev_eagles.png' },
  { id: 'HBF-D1', city: 'Herning', name: 'IK', bg: '#060638', color: '#FDCC0B', logo: T + 'herning_ik.png' },
  { id: 'HVI-D1', city: 'Hvidovre', name: 'IK', bg: '#005596', color: '#718BB5', logo: T + 'hvidovre_ik.png' },
  { id: 'ODB-D1', city: 'Odense', name: 'IK', bg: '#E90328', color: '#019D36', logo: T + 'odense_ik.png' },
  { id: 'RMB-D1', city: 'Rødovre', name: 'IK', bg: '#C5B0B2', color: '#D10F19', logo: T + 'r%C3%B8dovre_sik.png' },
  { id: 'RUN-D1', city: 'Rungsted', name: 'IK', bg: '#034284', color: '#B32D48', logo: T + 'rungsted_ishockey.png' }
];

// Denmark U20
export const denu20Teams = [
  { id: 'AAL-DK20', city: 'Aalborg', name: 'U20', bg: '#EC1B23', color: '#FFFFFF', seniorId: 'AAL', logo: T + 'aalborg_ik_u20.png' },
  { id: 'ESB-DK20', city: 'Esbjerg', name: 'U20', bg: '#0246FF', color: '#F2FD45', seniorId: 'ESB', logo: T + 'esbjerg_ik_u20.png' },
  { id: 'FWH-DK20', city: 'Frederikshavn', name: 'U20', bg: '#2C2227', color: '#956644', seniorId: 'FWH', logo: T + 'frederikshavn_ik_u20.png' },
  { id: 'GEN-DK20', city: 'Gentofte', name: 'U20', bg: '#002A5F', color: '#A26E2B', seniorId: 'GEN', logo: T + 'gentofte_stars_u20.png' },
  { id: 'HLV-DK20', city: 'Herlev', name: 'U20', bg: '#010725', color: '#FECB01', seniorId: 'HLV', logo: T + 'herlev_ik_u20.png' },
  { id: 'HBF-DK20', city: 'Herning', name: 'U20', bg: '#FECB02', color: '#1E1A34', seniorId: 'HBF', logo: T + 'herning_ik_u20.png' },
  { id: 'HVI-DK20', city: 'Hvidovre', name: 'U20', bg: '#005696', color: '#898AB1', seniorId: 'HVI', logo: T + 'hvidovre_ik_u20.png' },
  { id: 'ODB-DK20', city: 'Odense', name: 'U20', bg: '#019D37', color: '#E30427', seniorId: 'ODB', logo: T + 'odense_ik_u20.png' },
  { id: 'RMB-DK20', city: 'Rødovre', name: 'U20', bg: '#A62124', color: '#C9BDBD', seniorId: 'RMB', logo: T + 'r%C3%B8dovre_sik_u20.png' },
  { id: 'RUN-DK20', city: 'Rungsted', name: 'U20', bg: '#2C79B7', color: '#FFFFFF', seniorId: 'RUN', logo: T + 'rungsted_ik_u20.png' },
  { id: 'SON-DK20', city: 'SønderjyskE', name: 'U20', bg: '#374484', color: '#FFFFFF', seniorId: 'SON', logo: T + 's%C3%B8nderjyske_ishockey.png' }
];

// Denmark U18
export const denu18Teams = [
  { id: 'AAL-DK18', city: 'Aalborg', name: 'U18', bg: '#EC1B23', color: '#FFFFFF', seniorId: 'AAL', logo: T + 'aalborg_ik_u17.png' },
  { id: 'ESB-DK18', city: 'Esbjerg', name: 'U18', bg: '#0246FF', color: '#F2FD45', seniorId: 'ESB', logo: T + 'esbjerg_ik_u17.png' },
  { id: 'FWH-DK18', city: 'Frederikshavn', name: 'U18', bg: '#2C2227', color: '#956644', seniorId: 'FWH', logo: T + 'frederikshavn_ik_u17.png' },
  { id: 'GEN-DK18', city: 'Gentofte', name: 'U18', bg: '#002A5F', color: '#A26E2B', seniorId: 'GEN', logo: T + 'gentofte_stars_u17.png' },
  { id: 'HLV-DK18', city: 'Herlev', name: 'U18', bg: '#010725', color: '#FECB01', seniorId: 'HLV', logo: T + 'herlev_ik_u17.png' },
  { id: 'HBF-DK18', city: 'Herning', name: 'U18', bg: '#FECB02', color: '#1E1A34', seniorId: 'HBF', logo: T + 'herning_ik_u17.png' },
  { id: 'HVI-DK18', city: 'Hvidovre', name: 'U18', bg: '#005696', color: '#898AB1', seniorId: 'HVI', logo: T + 'hvidovre_ik_u17.png' },
  { id: 'ODB-DK18', city: 'Odense', name: 'U18', bg: '#019F37', color: '#E90328', seniorId: 'ODB', logo: T + 'odense_ik_u18.png' },
  { id: 'RMB-DK18', city: 'Rødovre', name: 'U18', bg: '#A62124', color: '#C9BDBD', seniorId: 'RMB', logo: T + 'r%C3%B8dovre_sik_u17.png' },
  { id: 'RUN-DK18', city: 'Rungsted', name: 'U18', bg: '#2C79B7', color: '#FFFFFF', seniorId: 'RUN', logo: T + 'rungsted_ik_u17.png' },
  { id: 'SON-DK18', city: 'SønderjyskE', name: 'U18', bg: '#374484', color: '#FFFFFF', seniorId: 'SON', logo: T + 's%C3%B8nderjyske_ishockey.png' }
];

// EliteHockey Ligaen
export const ehlTeams = [
  { id: 'FRA', city: 'Frisk', name: 'Asker', bg: '#272322', color: '#B3A494', rival: 'STJ', logo: T + 'frisk_asker_hockey.png' },
  { id: 'LIK', city: 'Lillehammer', name: 'IK', bg: '#054B88', color: '#FFFFFF', rival: 'STO', logo: T + 'lillehammer_ik.png' },
  { id: 'LOR', city: 'Lørenskog', name: 'IK', bg: '#243C71', color: '#FFFFFF', rival: 'VIF', logo: T + 'l%C3%B8renskog_ik.png' },
  { id: 'NAR', city: 'Narvik', name: 'IK', bg: '#0E365A', color: '#407CA2', logo: T + 'narvik_hockey.png' },
  { id: 'NID', city: 'Nidaros', name: 'Hockey', bg: '#221E20', color: '#4D6E79', logo: T + 'nidaros_hockey.png' },
  { id: 'SPA', city: 'Sparta', name: 'Sarpsborg', bg: '#05365D', color: '#D7B76E', rival: 'STJ', logo: T + 'sparta_sarpsborg.png' },
  { id: 'STV', city: 'Stavanger', name: 'Oilers', bg: '#0D0606', color: '#5B4E1B', rival: 'STO', logo: T + 'stavanger_oilers.png' },
  { id: 'STJ', city: 'Stjernen', name: 'Fredrikstad', bg: '#CB2127', color: '#FFFFFF', rival: 'SPA', logo: T + 'stjernen_hockey.png' },
  { id: 'STO', city: '', name: 'Storhamar', bg: '#22985D', color: '#95908F', rival: 'LIK', logo: T + 'storhamar_hockey.png' },
  { id: 'VIF', city: '', name: 'Vålerenga', bg: '#262989', color: '#C29BB4', rival: 'LOR', logo: T + 'v%C3%A5lerenga_if.png' }
];

// HockeyLiga1
export const nor1Teams = [
  { id: 'COM', city: 'Comet', name: 'Halden', bg: '#FFEC5B', color: '#00A762', logo: T + 'halden_comet.png' },
  { id: 'FUR', city: 'Furuset', name: 'Oslo', bg: '#00458C', color: '#8FA1B5', logo: T + 'furuset.png' },
  { id: 'GRU', city: 'Grüner', name: 'Oslo', bg: '#342B7C', color: '#F6E1B2', logo: T + 'gr%C3%BCner.png' },
  { id: 'HAS', city: 'Hasle-Løren', name: 'Oslo', bg: '#01498E', color: '#FEFFFE', logo: T + 'hasle_l%C3%B8ren.png' },
  { id: 'JUT', city: 'Jutul', name: 'Bærum', bg: '#1F2937', color: '#FFFFFF', logo: '' },
  { id: 'MAN', city: 'Manglerud', name: 'Star', bg: '#F9E21E', color: '#14894D', logo: T + 'manglerud_star.png' },
  { id: 'RIN', city: 'Ringerike', name: 'Panthers', bg: '#1A181A', color: '#8D8A7D', logo: T + 'ringerike_ihk_panthers.png' },
  { id: 'SKI', city: 'Ski', name: 'IL', bg: '#1F2937', color: '#FFFFFF', logo: '' },
  { id: 'TON', city: 'Tønsberg', name: 'Vikings', bg: '#AB827E', color: '#3B3735', logo: T + 't%C3%B8nsberg_vikings.png' },
  { id: 'KON', city: 'Kongsvinger', name: 'Knights', bg: '#3A1E21', color: '#E1212C', logo: T + 'kongsvinger_knights.png' }
];

// Norway U20
export const noru20Teams = [
  { id: 'FRA-NO20', city: 'Frisk Asker', name: 'U20', bg: '#272322', color: '#B3A494', seniorId: 'FRA', logo: T + 'frisk_asker_u20.png' },
  { id: 'LIK-NO20', city: 'Lillehammer', name: 'U20', bg: '#355E93', color: '#FFFFFF', seniorId: 'LIK', logo: T + 'lillehammer_ik_u20.png' },
  { id: 'LOR-NO20', city: 'Lørenskog', name: 'U20', bg: '#253A6F', color: '#FFFFFF', seniorId: 'LOR', logo: T + 'l%C3%B8renskog_ik_u20.png' },
  { id: 'NID-NO20', city: 'Nidaros', name: 'U20', bg: '#221E20', color: '#4D6E79', seniorId: 'NID', logo: T + 'nidaros_hockey.png' },
  { id: 'SPA-NO20', city: 'Sparta', name: 'U20', bg: '#897C65', color: '#161C27', seniorId: 'SPA', logo: T + 'sparta_sarpsborg_u20.png' },
  { id: 'STV-NO20', city: 'Stavanger', name: 'U20', bg: '#1B1C20', color: '#D7B906', seniorId: 'STV', logo: T + 'stavanger_oilers_u20.png' },
  { id: 'STJ-NO20', city: 'Stjernen', name: 'U20', bg: '#CD2128', color: '#FFFFFF', seniorId: 'STJ', logo: T + 'stjernen_hockey_u20.png' },
  { id: 'STO-NO20', city: 'Storhamar', name: 'U20', bg: '#326533', color: '#B43734', seniorId: 'STO', logo: T + 'storhamar_u20.png' },
  { id: 'VIF-NO20', city: 'Vålerenga', name: 'U20', bg: '#262989', color: '#C29BB4', seniorId: 'VIF', logo: T + 'v%C3%A5lerenga_if_u20.png' },
  { id: 'MAN-NO20', city: 'Manglerud', name: 'U20', bg: '#009C59', color: '#FFFFFF', seniorId: 'MAN', logo: T + 'manglerud_star_u20.png' },
  { id: 'FUR-NO20', city: 'Furuset', name: 'U20', bg: '#00458C', color: '#8FA1B5', seniorId: 'FUR', logo: T + 'furuset.png' }
];

// Norway U18
export const noru18Teams = [
  { id: 'FRA-NO18', city: 'Frisk Asker', name: 'U18', bg: '#928576', color: '#161419', seniorId: 'FRA', logo: T + 'if_frisk_asker_tigers_u18.png' },
  { id: 'LIK-NO18', city: 'Lillehammer', name: 'U18', bg: '#355E93', color: '#FFFFFF', seniorId: 'LIK', logo: T + 'lillehammer_ik_u18.png' },
  { id: 'LOR-NO18', city: 'Lørenskog', name: 'U18', bg: '#253A6F', color: '#FFFFFF', seniorId: 'LOR', logo: T + 'l%C3%B8renskog_ik_u18.png' },
  { id: 'NID-NO18', city: 'Nidaros', name: 'U18', bg: '#221E20', color: '#4D6E79', seniorId: 'NID', logo: T + 'nidaros_hockey_u18.png' },
  { id: 'SPA-NO18', city: 'Sparta', name: 'U18', bg: '#05365D', color: '#D7B76E', seniorId: 'SPA', logo: T + 'sparta_sarpsborg_warriors_u18.png' },
  { id: 'STV-NO18', city: 'Stavanger', name: 'U18', bg: '#1B1C20', color: '#D7B906', seniorId: 'STV', logo: T + 'stavanger_oilers_u18.png' },
  { id: 'STJ-NO18', city: 'Stjernen', name: 'U18', bg: '#CD2128', color: '#FFFFFF', seniorId: 'STJ', logo: T + 'stjernen_hockey_u18.png' },
  { id: 'STO-NO18', city: 'Storhamar', name: 'U18', bg: '#22985D', color: '#95908F', seniorId: 'STO', logo: T + 'storhamar_dragons_u18.png' },
  { id: 'VIF-NO18', city: 'Vålerenga', name: 'U18', bg: '#262989', color: '#C29BB4', seniorId: 'VIF', logo: T + 'v%C3%A5lerenga_if_u18.png' },
  { id: 'MAN-NO18', city: 'Manglerud', name: 'U18', bg: '#009C59', color: '#FFFFFF', seniorId: 'MAN', logo: T + 'manglerud_star_u18.png' },
  { id: 'FUR-NO18', city: 'Furuset', name: 'U18', bg: '#00448B', color: '#9CA8B8', seniorId: 'FUR', logo: T + 'furuset_u18.png' }
];

// Swiss League
export const slTeams = [
  { id: 'OLT', city: 'EHC', name: 'Olten', bg: '#22221D', color: '#B6BBB2', logo: T + 'ehc_olten.png' },
  { id: 'ARO', city: 'EHC', name: 'Arosa', bg: '#004CA0', color: '#9EA474', logo: T + 'ehc_arosa.png' },
  { id: 'GCK', city: 'GCK', name: 'Lions', bg: '#0163AC', color: '#FFFFFF', logo: T + 'gck_lions.png' },
  { id: 'BAS', city: 'EHC', name: 'Basel', bg: '#000000', color: '#9A0D1B', logo: T + 'ehc_basel.png' },
  { id: 'WIN', city: 'EHC', name: 'Winterthur', bg: '#E0162A', color: '#2A0A0D', logo: T + 'ehc_winterthur.png' },
  { id: 'BEL', city: 'Bellinzona', name: 'Snakes', bg: '#EB8383', color: '#FFE6E6', logo: T + 'gdt_bellinzona.png' },
  { id: 'LCF', city: 'La Chaux-de-Fonds', name: 'HC', bg: '#0C3F75', color: '#BEB18C', logo: T + 'hc_la_chaux-de-fonds.png' },
  { id: 'SIE', city: 'HC', name: 'Sierre', bg: '#FFFF01', color: '#FD1812', rival: 'VIS', logo: T + 'hc_sierre.png' },
  { id: 'VIS', city: 'EHC', name: 'Visp', bg: '#C40B0D', color: '#3F1613', rival: 'SIE', logo: T + 'ehc_visp.png' },
  { id: 'CHU', city: 'EHC', name: 'Chur', bg: '#FF0505', color: '#050505', logo: T + 'ehc_chur.png' }
];

// DEL2
export const del2Teams = [
  { id: 'DEG', city: 'Düsseldorfer', name: 'EG', bg: '#DE242C', color: '#FFFFFF', rival: 'KEV', logo: T + 'd%C3%BCsseldorfer_eg.png' },
  { id: 'LAN', city: 'EV', name: 'Landshut', bg: '#D41614', color: '#FFFFFF', logo: T + 'ev_landshut.png' },
  { id: 'REG', city: 'Eisbären', name: 'Regensburg', bg: '#2C1E1F', color: '#A39E9E', logo: T + 'regensburg_eisb%C3%A4ren.png' },
  { id: 'KAS', city: 'Kassel', name: 'Huskies', bg: '#091D3A', color: '#9D9293', rival: 'BNA', logo: T + 'ec_kassel_huskies.png' },
  { id: 'DRE', city: 'Dresdner', name: 'Eislöwen', bg: '#1F2937', color: '#FFFFFF', rival: 'LAU', logo: T + 'dresdner_eisl%C3%B6wen.png' },
  { id: 'ROS', city: 'Starbulls', name: 'Rosenheim', bg: '#0D0B0C', color: '#3D524E', logo: T + 'rosenheim_starbulls.png' },
  { id: 'LAU', city: 'Lausitzer', name: 'Füchse', bg: '#C59F80', color: '#D2071F', rival: 'DRE', logo: T + 'lausitzer_f%C3%BCchse.png' },
  { id: 'WEI', city: 'Blue Devils', name: 'Weiden', bg: '#ADBDCE', color: '#4E2142', logo: T + 'weiden_blue_devils.png' },
  { id: 'MEM', city: 'Memmingen', name: 'Indians', bg: '#E20510', color: '#650607', logo: T + 'ecdc_memmingen_indians.png' },
  { id: 'RAV', city: 'Ravensburg', name: 'Towerstars', bg: '#184086', color: '#D21416', logo: T + 'ravensburg_towerstars.png' },
  { id: 'CRI', city: 'Eispiraten', name: 'Crimmitschau', bg: '#CC322D', color: '#202021', logo: T + 'crimmitschau_eispiraten.png' },
  { id: 'FRE', city: 'EHC', name: 'Freiburg', bg: '#1A2033', color: '#5D5061', logo: T + 'ehc_freiburg_w%C3%B6lfe.png' },
  { id: 'BIE', city: 'Bietigheim', name: 'Steelers', bg: '#1B7959', color: '#7D7D7D', logo: T + 'bietigheim_steelers.png' },
  { id: 'BNA', city: 'EC', name: 'Bad Nauheim', bg: '#1A1A18', color: '#C9B5B5', rival: 'KAS', logo: T + 'ec_bad_nauheim.png' }
];

// Alps Hockey League
export const alpsTeams = [
  { id: 'KIT', city: 'Kitzbühel', name: 'Adler', bg: '#005397', color: '#FFF607', logo: T + 'ec_kitzb%C3%BChel.png' },
  { id: 'KACF', city: 'EC-KAC', name: 'Future Team', bg: '#B9242E', color: '#FFFFFF', logo: T + 'ec-kac_ii.png' },
  { id: 'ZEL', city: 'Zeller', name: 'Eisbären', bg: '#1F2937', color: '#FFFFFF', logo: T + 'ek_zeller_eisb%C3%A4ren.png' },
  { id: 'ASI', city: 'Asiago', name: 'Hockey', bg: '#4A3C27', color: '#C58A32', logo: T + 'asiago_hockey.png' },
  { id: 'GHE', city: 'HC', name: 'Gherdëina', bg: '#F2060F', color: '#2E3B6B', logo: T + 'hc_gherd%C3%ABina.png' },
  { id: 'MER', city: 'HC', name: 'Meran/o', bg: '#CFC093', color: '#302D2D', logo: T + 'hc_meran.png' },
  { id: 'JES', city: 'HD', name: 'Jesenice', bg: '#FFFFFF', color: '#000000', logo: T + 'hk_jesenice.png' },
  { id: 'UNT', city: 'Unterland', name: 'Cavaliers', bg: '#1F2937', color: '#FFFFFF', logo: T + 'hc_unterland.png' },
  { id: 'SIS', city: 'KHL', name: 'Sisak', bg: '#204E48', color: '#24A48A', logo: T + 'khl_sisak.png' },
  { id: 'RBJ', city: 'Red Bull', name: 'Juniors', bg: '#8E637F', color: '#AD1546', logo: T + 'red_bull_hockey_juniors.png' },
  { id: 'RIT', city: 'Rittner', name: 'Buam', bg: '#5E1010', color: '#FFFFFF', logo: T + 'rittner_buam.png' },
  { id: 'COR', city: 'SG', name: 'Cortina', bg: '#32336D', color: '#EFCD3A', logo: T + 'sg_cortina.png' },
  { id: 'WIP', city: 'Wipptal', name: 'Broncos', bg: '#0A3D7B', color: '#021524', logo: T + 'wsv_sterzing_broncos.png' }
];

// Ligue Magnus
export const magnusTeams = [
  { id: 'AMI', city: 'Amiens', name: 'Gothiques', bg: '#1F2937', color: '#FFFFFF', logo: T + 'amiens_gothiques.png' },
  { id: 'ANG', city: 'Angers', name: 'Ducs', bg: '#141434', color: '#69606F', logo: T + 'angers_ducs.png' },
  { id: 'ANT', city: 'Anglet', name: 'Hormadi', bg: '#050708', color: '#CFD0D1', rival: 'BDX', logo: T + 'anglet_hormadi.png' },
  { id: 'BDX', city: 'Bordeaux', name: 'Boxers', bg: '#23201E', color: '#8B8B8A', rival: 'ANT', logo: T + 'bordeaux_boxers.png' },
  { id: 'BRI', city: 'Briançon', name: 'Diables Rouges', bg: '#412022', color: '#DF2027', rival: 'GAP', logo: T + 'brian%C3%A7on_diables_rouges.png' },
  { id: 'CER', city: 'Cergy-Pontoise', name: 'Jokers', bg: '#36331E', color: '#779883', logo: T + 'cergy-pontoise_jokers.png' },
  { id: 'CHA', city: 'Chamonix', name: 'Pionniers', bg: '#172246', color: '#FFFFFF', logo: T + 'chamonix_chamois.png' },
  { id: 'GAP', city: 'Gap', name: 'Rapaces', bg: '#242122', color: '#505A62', rival: 'BRI', logo: T + 'gap_rapaces.png' },
  { id: 'GRE', city: 'Grenoble', name: 'Brûleurs de Loups', bg: '#0E151B', color: '#D48B2F', rival: 'ROU', logo: T + 'grenoble_br%C3%BBleurs_de_loups.png' },
  { id: 'MAR', city: 'Marseille', name: 'Spartiates', bg: '#01010A', color: '#D5DCE0', rival: 'NIC', logo: T + 'marseille_spartiates.png' },
  { id: 'NIC', city: 'Nice', name: 'Aigles', bg: '#1D1F1D', color: '#A7857D', rival: 'MAR', logo: T + 'nice_aigles.png' },
  { id: 'ROU', city: 'Rouen', name: 'Dragons', bg: '#231F0F', color: '#B7A05A', rival: 'GRE', logo: T + 'rouen_dragons.png' }
];

// Elite Ice Hockey League
export const eihlTeams = [
  { id: 'BEL', city: 'Belfast', name: 'Giants', bg: '#154C57', color: '#FFFFFF', logo: T + 'belfast_giants.png' },
  { id: 'CAR', city: 'Cardiff', name: 'Devils', bg: '#1A0607', color: '#A21B23', logo: T + 'cardiff_devils.png' },
  { id: 'COV', city: 'Coventry', name: 'Blaze', bg: '#153452', color: '#849BAE', logo: T + 'coventry_blaze.png' },
  { id: 'DUN', city: 'Dundee', name: 'Stars', bg: '#002B55', color: '#FFFFFF', rival: 'FIF', logo: T + 'dundee_stars.png' },
  { id: 'FIF', city: 'Fife', name: 'Flyers', bg: '#2F4A91', color: '#FFFFFF', rival: 'DUN', logo: T + 'fife_flyers.png' },
  { id: 'GLA', city: 'Glasgow', name: 'Clan', bg: '#07050D', color: '#3E335E', rival: 'FIF', logo: T + 'glasgow_clan.png' },
  { id: 'GUI', city: 'Guildford', name: 'Flames', bg: '#580E25', color: '#95786D', logo: T + 'guildford_flames.png' },
  { id: 'MAN', city: 'Manchester', name: 'Storm', bg: '#1F2937', color: '#FFFFFF', rival: 'SHE', logo: T + 'manchester_storm.png' },
  { id: 'NOT', city: 'Nottingham', name: 'Panthers', bg: '#201B18', color: '#575D58', rival: 'SHE', logo: T + 'nottingham_panthers.png' },
  { id: 'SHE', city: 'Sheffield', name: 'Steelers', bg: '#1F1E1D', color: '#989190', rival: 'NOT', logo: T + 'sheffield_steelers.png' }
];

// Supreme Hockey League
export const vhlTeams = [
  { id: 'DSP', city: 'Dynamo', name: 'St. Petersburg', bg: '#1B3C72', color: '#91A1BA', rival: 'SKAN', logo: T + 'st__petersburg_dynamo.png' },
  { id: 'SKAN', city: 'SKA-Neva', name: 'St. Petersburg', bg: '#D76447', color: '#FFFFFF', rival: 'DSP', logo: T + 'st__petersburg_ska-neva.png' },
  { id: 'KHV', city: 'Khimik', name: 'Voskresensk', bg: '#0193DF', color: '#FCF800', logo: T + 'mhc_khimik_voskresensk.png' },
  { id: 'RYA', city: 'HC', name: 'Ryazan', bg: '#09254E', color: '#60809E', logo: T + 'hk_ryazan.png' },
  { id: 'RUB', city: 'Rubin', name: 'Tyumen', bg: '#1C1D1B', color: '#AE1740', logo: T + 'tyumen_rubin.png' },
  { id: 'TOG', city: 'Torpedo-Gorky', name: 'Nizhny Novgorod', bg: '#233C70', color: '#CE112E', logo: T + 'nizhny_novgorod_torpedo-gorky.png' },
  { id: 'NEF', city: 'Neftyanik', name: 'Almetyevsk', bg: '#141213', color: '#FFFFFF', logo: T + 'almetievsk_neftyanik.png' },
  { id: 'YUG', city: 'Yugra', name: 'Khanty-Mansiysk', bg: '#051635', color: '#134379', logo: T + 'khanty-mansiysk_yugra.png' },
  { id: 'ZVE', city: 'Zvezda', name: 'Moscow', bg: '#CF9EAB', color: '#834462', logo: T + 'zvezda.png' },
  { id: 'IZH', city: 'Izhstal', name: 'Izhevsk', bg: '#E8232B', color: '#443088', logo: T + 'izhevsk_izhstal.png' },
  { id: 'MOL', city: 'Molot', name: 'Perm', bg: '#000000', color: '#2F2F2F', logo: T + 'perm_molot.png' },
  { id: 'DIZ', city: 'Dizel', name: 'Penza', bg: '#000000', color: '#FDD427', logo: T + 'penza_dizel.png' },
  { id: 'BUR', city: 'Buran', name: 'Voronezh', bg: '#0D3669', color: '#99ACC7', logo: T + 'voronezh_buran.png' },
  { id: 'GOR', city: 'Gornyak-UGMK', name: 'Verkhnyaya Pyshma', bg: '#0C0C0E', color: '#FFFFFF', logo: T + 'ugmk_gornyak.png' },
  { id: 'MNK', city: 'Metallurg', name: 'Novokuznetsk', bg: '#000000', color: '#B31F24', logo: T + 'novokuznetsk_metallurg.png' },
  { id: 'TOR', city: 'Toros', name: 'Neftekamsk', bg: '#8EABD1', color: '#FCFEFC', logo: T + 'neftekamsk_toros.png' },
  { id: 'SOK', city: 'Sokol', name: 'Krasnoyarsk', bg: '#2E2643', color: '#9F98A3', logo: T + 'krasnoyarsk_sokol.png' },
  { id: 'CHM', city: 'Chelmet', name: 'Chelyabinsk', bg: '#FFFFFF', color: '#000000', logo: T + 'chelyabinsk_chelmet.png' },
  { id: 'BAR', city: 'Bars', name: 'Kazan', bg: '#317C3F', color: '#978584', logo: T + 'kazan_bars.png' },
  { id: 'ZAU', city: 'Zauralie', name: 'Kurgan', bg: '#9DA9B4', color: '#051E42', logo: T + 'kurgan_zauralie.png' },
  { id: 'ROS', city: 'HC', name: 'Rostov', bg: '#BEA5A5', color: '#332928', logo: T + 'hk_rostov.png' },
  { id: 'KRS', city: 'Krylya Sovetov', name: 'Moscow', bg: '#142882', color: '#AC98B6', logo: T + 'moscow_mhk_krylia_sovetov.png' },
  { id: 'YER', city: 'Yermak', name: 'Angarsk', bg: '#1B1A19', color: '#B2B2B0', logo: T + 'angarsk_yermak.png' },
  { id: 'OMK', city: 'Omskie Krylia', name: 'Omsk', bg: '#1A0A02', color: '#BEAF9B', logo: T + 'omskie_krylia.png' },
  { id: 'TAM', city: 'HC', name: 'Tambov', bg: '#050505', color: '#898989', logo: T + 'hk_tambov.png' },
  { id: 'AKM', city: 'AKM', name: 'Tula', bg: '#1B2A52', color: '#A0959E', logo: T + 'tula_region_akm.png' }
];

// Junior Hockey League
export const mhlTeams = [
  { id: 'SKA-M', city: 'SKA-1946', name: 'St. Petersburg', bg: '#DB2B3B', color: '#3D3362', conf: 'West', seniorId: 'SKA', logo: T + 'st__petersburg_ska-1946.png' },
  { id: 'CSKA-M', city: 'Krasnaya Armiya', name: 'Moscow', bg: '#9E6173', color: '#D4222D', conf: 'West', seniorId: 'CSKA', logo: T + 'moscow_krasnaya_armiya.png' },
  { id: 'LOK-M', city: 'Loko', name: 'Yaroslavl', bg: '#1C3064', color: '#FFFFFF', conf: 'West', seniorId: 'LOK', logo: T + 'yaroslavl_loko.png' },
  { id: 'DYN-M', city: 'MHK Dynamo', name: 'Moscow', bg: '#002659', color: '#DDDEE1', conf: 'West', seniorId: 'DYN', logo: T + 'moscow_mhk_dynamo.png' },
  { id: 'SPA-M', city: 'MHK Spartak', name: 'Moscow', bg: '#EE3125', color: '#FFFFFF', conf: 'West', seniorId: 'SPA', logo: T + 'moscow_mhk_spartak.png' },
  { id: 'VIT-M', city: 'Russkie Vityazi', name: 'Chekhov', bg: '#CEA474', color: '#C91E29', conf: 'West', logo: T + 'podolsk_russkie_vityazi.png' },
  { id: 'ALM-M', city: 'Almaz', name: 'Cherepovets', bg: '#1F2937', color: '#FFFFFF', conf: 'West', seniorId: 'SEV', logo: T + 'cherepovets_almaz.png' },
  { id: 'ATL-M', city: 'Atlant', name: 'Mytishchi', bg: '#052442', color: '#767E81', conf: 'West', logo: T + 'mytishchi_atlant.png' },
  { id: 'CHA-M', city: 'Chayka', name: 'Nizhny Novgorod', bg: '#B6A3B5', color: '#D3343A', conf: 'West', seniorId: 'TOR', logo: T + 'nizhny_novgorod_chaika.png' },
  { id: 'KAP-M', city: 'Kapitan', name: 'Stupino', bg: '#ED1D21', color: '#57699E', conf: 'West', logo: T + 'stupino_kapitan.png' },
  { id: 'SKV-M', city: 'SKA-Varyagi', name: 'St. Petersburg', bg: '#14467A', color: '#798DA9', conf: 'West', logo: T + 'ska-varyagi.png' },
  { id: 'L76-M', city: 'Loko-76', name: 'Yaroslavl', bg: '#C1ACBF', color: '#FFFFFF', conf: 'West', logo: T + 'yaroslavl_loko-76.png' },
  { id: 'KRS-M', city: 'Krylya Sovetov', name: 'Moscow', bg: '#142882', color: '#AC98B6', conf: 'West', logo: T + 'moscow_mhk_krylia_sovetov.png' },
  { id: 'SHI-M', city: 'Dinamo-Shinnik', name: 'Bobruisk', bg: '#C8DCE7', color: '#363D73', conf: 'West', logo: T + 'dinamo_shinnik.png' },
  { id: 'IRB-M', city: 'Irbis', name: 'Kazan', bg: '#DE251D', color: '#046346', conf: 'East', seniorId: 'AKB', logo: T + 'kazan_irbis.png' },
  { id: 'REA-M', city: 'Reaktor', name: 'Nizhnekamsk', bg: '#4A438F', color: '#D4D2E2', conf: 'East', seniorId: 'NEF', logo: T + 'nizhnekamsk_reaktor.png' },
  { id: 'TOL-M', city: 'Tolpar', name: 'Ufa', bg: '#28146F', color: '#4EA3A0', conf: 'East', seniorId: 'SAL', logo: T + 'ufa_tolpar.png' },
  { id: 'STF-M', city: 'Stalnye Lisy', name: 'Magnitogorsk', bg: '#0E2040', color: '#C3995B', conf: 'East', seniorId: 'MET', logo: T + 'magnitogorsk_stalnye_lisy.png' },
  { id: 'AVT-M', city: 'Avto', name: 'Yekaterinburg', bg: '#000000', color: '#E50002', conf: 'East', seniorId: 'AVT', logo: T + 'yekaterinburg_avto.png' },
  { id: 'BEL-M', city: 'Belye Medvedi', name: 'Chelyabinsk', bg: '#000002', color: '#FFFFFF', conf: 'East', seniorId: 'TRA', logo: T + 'chelyabinsk_belye_medvedi.png' },
  { id: 'OMY-M', city: 'Omskie Yastreby', name: 'Omsk', bg: '#1C2226', color: '#C4B59E', conf: 'East', seniorId: 'AVA', logo: T + 'omskie_yastreby.png' },
  { id: 'SIB-M', city: 'Sibirskie Snaipery', name: 'Novosibirsk', bg: '#1F2937', color: '#FFFFFF', conf: 'East', seniorId: 'SIB', logo: T + 'novosibirsk_sibirskie_snaipery.png' },
  { id: 'KUZ-M', city: 'Kuznetskie Medvedi', name: 'Novokuznetsk', bg: '#C75418', color: '#070506', conf: 'East', logo: T + 'novokuznetsk_kuznetskie_medvedi.png' },
  { id: 'MAM-M', city: 'Mamonty Yugry', name: 'Khanty-Mansiysk', bg: '#181F1D', color: '#6A95A8', conf: 'East', logo: T + 'yugry_mamonty.png' },
  { id: 'LAD-M', city: 'Ladya', name: 'Togliatti', bg: '#4F6D90', color: '#D0D7E0', conf: 'East', seniorId: 'LAD', logo: T + 'togliatti_ladia.png' },
  { id: 'TAY-M', city: 'Taifun', name: 'Vladivostok', bg: '#091E30', color: '#6499BF', conf: 'East', seniorId: 'ADM', logo: T + 'primorsky_krai_taifun.png' },
  { id: 'AMT-M', city: 'Amurskie Tigry', name: 'Khabarovsk', bg: '#161A23', color: '#C06C47', conf: 'East', seniorId: 'AMU', logo: T + 'khabarovsk_amurskie_tigry.png' },
  { id: 'TYU-M', city: 'Tyumensky Legion', name: 'Tyumen', bg: '#16100D', color: '#5F222F', conf: 'East', logo: T + 'tyumenski_legion.png' },
  { id: 'SPU-M', city: 'Sputnik', name: 'Almetyevsk', bg: '#EE2026', color: '#601B23', conf: 'East', logo: T + 'almetievsk_sputnik.png' },
  { id: 'AKJ-M', city: 'AKM-Junior', name: 'Tula', bg: '#1B2A52', color: '#A0959E', conf: 'West', logo: T + 'akm_yunior.png' }
];

// Australian Ice Hockey League
export const aihlTeams = [
  { id: 'ADL', city: 'Adelaide', name: 'Adrenaline', bg: '#13233D', color: '#FFFFFF', logo: T + 'adelaide_adrenaline.png' },
  { id: 'BRI', city: 'Brisbane', name: 'Lightning', bg: '#1D1D1E', color: '#A6A6A7', logo: T + 'brisbane_lightning.png' },
  { id: 'CBR', city: 'Canberra', name: 'Brave', bg: '#1F2937', color: '#FFFFFF', logo: '' },
  { id: 'CCR', city: 'Central Coast', name: 'Rhinos', bg: '#699FBB', color: '#274B6F', logo: T + 'central_coast_rhinos.png' },
  { id: 'MEI', city: 'Melbourne', name: 'Ice', bg: '#0D3B73', color: '#FFFFFF', rival: 'MEM', logo: T + 'melbourne_ice.png' },
  { id: 'MEM', city: 'Melbourne', name: 'Mustangs', bg: '#754F3E', color: '#B1A49E', rival: 'MEI', logo: T + 'melbourne_mustangs.png' },
  { id: 'NEW', city: 'Newcastle', name: 'Northstars', bg: '#242262', color: '#DF1D28', logo: T + 'newcastle_northstars.png' },
  { id: 'PER', city: 'Perth', name: 'Thunder', bg: '#05295F', color: '#FFFFFF', logo: T + 'perth_thunder.png' },
  { id: 'SYB', city: 'Sydney', name: 'Bears', bg: '#B9151A', color: '#FFFFFF', rival: 'SYI', logo: T + 'sydney_bears.png' },
  { id: 'SYI', city: 'Sydney', name: 'Ice Dogs', bg: '#1F203D', color: '#C0BFBB', rival: 'SYB', logo: T + 'sydney_ice_dogs.png' }
];

export const EXTRA_LEAGUES = {
  ALLSV: { abbr: 'HA', name: 'HockeyAllsvenskan', label: 'HockeyAllsvenskan', country: 'SWE', tier: 2, kind: 'pro', games: 52, playoffSpots: 10, playoffFormat: 'shl-10', level: 13, cup: 'HockeyAllsvenskan Championship', logo: LG + 'hockeyallsvenskan.png', conferences: [], divisions: [], rounds: ["Eighth-Final", "Quarterfinal", "Semifinal", "Allsvenskan Final"], teams: allsvTeams },
  ETTAN: { abbr: 'Ettan', name: 'Hockeyettan', label: 'Hockeyettan', country: 'SWE', tier: 3, kind: 'pro', games: 38, playoffSpots: 8, playoffFormat: 'ettan-8', level: 20, cup: 'Hockeyettan Championship', logo: LG + 'hockeyettan.png', conferences: ["North", "South"], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Hockeyettan Final"], teams: ettanTeams },
  J18: { abbr: 'J18', name: 'U18 Nationell', label: 'U18 Nationell', country: 'SWE', tier: 0, kind: 'u18', games: 32, playoffSpots: 8, playoffFormat: 'j18-8', level: 24, cup: 'Swedish U18 Championship', parentJunior: 'J20', logo: LG + 'sweden_j18_elit.png', conferences: ["North", "South"], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U18 SM Final"], teams: j18Teams },
  MESTIS: { abbr: 'Mestis', name: 'Mestis', label: 'Mestis', country: 'FIN', tier: 2, kind: 'pro', games: 48, playoffSpots: 8, playoffFormat: 'mestis-8', level: 15, cup: 'Mestis Championship', logo: LG + 'mestis.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Mestis Final"], bronzeGame: true, teams: mestisTeams },
  SUOMI: { abbr: 'Suomi-sarja', name: 'Suomi-sarja', label: 'Suomi-sarja', country: 'FIN', tier: 3, kind: 'pro', games: 36, playoffSpots: 8, playoffFormat: 'mestis-8', level: 21, cup: 'Suomi-sarja Championship', logo: LG + 'suomi-sarja.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Suomi-sarja Final"], teams: suomiTeams },
  U20M: { abbr: 'U20 Mestis', name: 'U20 Mestis', label: 'U20 Mestis', country: 'FIN', tier: 0, kind: 'junior', games: 40, playoffSpots: 8, playoffFormat: 'mestis-8', level: 19, cup: 'U20 Mestis Championship', parent: 'MESTIS', logo: LG + 'u20_mestis.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U20 Mestis Final"], teams: u20mTeams },
  U18: { abbr: 'U18', name: 'U18 SM-sarja', label: 'U18 SM-sarja', country: 'FIN', tier: 0, kind: 'u18', games: 36, playoffSpots: 8, playoffFormat: 'best-of-3-8', level: 24, cup: 'Finnish U18 Championship', parentJunior: 'U20', logo: LG + 'u18_sm-sarja.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U18 SM Final"], bronzeGame: true, teams: u18Teams },
  U18M: { abbr: 'U18 Mestis', name: 'U18 Mestis', label: 'U18 Mestis', country: 'FIN', tier: 0, kind: 'u18', games: 32, playoffSpots: 8, playoffFormat: 'best-of-3-8', level: 26, cup: 'U18 Mestis Championship', parentJunior: 'U20M', logo: LG + 'u18_mestis.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U18 Mestis Final"], teams: u18mTeams },
  METAL: { abbr: 'Metal', name: 'Metal Ligaen', label: 'Metal Ligaen', country: 'DEN', tier: 1, kind: 'pro', games: 48, playoffSpots: 8, playoffFormat: 'best-of-7-8', level: 17, cup: 'Danish Championship', logo: LG + 'metal_ligaen.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Metal Ligaen Final"], teams: metalTeams },
  DEN1: { abbr: '1. Div', name: 'Danish 1st Division', label: '1. Division', country: 'DEN', tier: 2, kind: 'pro', games: 30, playoffSpots: 8, playoffFormat: 'best-of-5-8', level: 24, cup: '1. Division Championship', logo: LG + 'danish_1__division.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "1. Division Final"], teams: den1Teams },
  DENU20: { abbr: 'U20', name: 'Denmark U20', label: 'Denmark U20', country: 'DEN', tier: 0, kind: 'junior', games: 28, playoffSpots: 8, playoffFormat: 'best-of-5-8', level: 21, cup: 'Danish U20 Championship', parent: 'METAL', logo: LG + 'denmark_u20.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U20 Final"], teams: denu20Teams },
  DENU18: { abbr: 'U18', name: 'Denmark U18', label: 'Denmark U18', country: 'DEN', tier: 0, kind: 'u18', games: 24, playoffSpots: 8, playoffFormat: 'best-of-3-8', level: 26, cup: 'Danish U18 Championship', parentJunior: 'DENU20', logo: LG + 'denmark_u18.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U18 Final"], teams: denu18Teams },
  EHL: { abbr: 'EHL', name: 'EliteHockey Ligaen', label: 'EHL', country: 'NOR', tier: 1, kind: 'pro', games: 45, playoffSpots: 8, playoffFormat: 'best-of-7-8', level: 18, cup: 'Kongepokal', logo: LG + 'elitehockey_ligaen.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "EHL Final"], teams: ehlTeams },
  NOR1: { abbr: 'HL1', name: 'HockeyLiga1', label: 'HockeyLiga1', country: 'NOR', tier: 2, kind: 'pro', games: 36, playoffSpots: 8, playoffFormat: 'best-of-5-8', level: 24, cup: 'HockeyLiga1 Championship', logo: LG + 'norwegian_1_divisjon.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "HockeyLiga1 Final"], teams: nor1Teams },
  NORU20: { abbr: 'U20', name: 'Norway U20', label: 'Norway U20', country: 'NOR', tier: 0, kind: 'junior', games: 30, playoffSpots: 8, playoffFormat: 'best-of-5-8', level: 21, cup: 'Norwegian U20 Championship', parent: 'EHL', logo: LG + 'norwegian_u20_elite.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U20 Final"], teams: noru20Teams },
  NORU18: { abbr: 'U18', name: 'Norway U18', label: 'Norway U18', country: 'NOR', tier: 0, kind: 'u18', games: 26, playoffSpots: 8, playoffFormat: 'best-of-3-8', level: 26, cup: 'Norwegian U18 Championship', parentJunior: 'NORU20', logo: LG + 'norway_u18.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "U18 Final"], teams: noru18Teams },
  SL: { abbr: 'SL', name: 'Swiss League', label: 'Swiss League', country: 'SUI', tier: 2, kind: 'pro', games: 48, playoffSpots: 8, playoffFormat: 'best-of-7-8', level: 15, cup: 'Swiss League Championship', logo: LG + 'swiss_league.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Swiss League Final"], teams: slTeams },
  DEL2: { abbr: 'DEL2', name: 'DEL2', label: 'DEL2', country: 'GER', tier: 2, kind: 'pro', games: 52, playoffSpots: 10, playoffFormat: 'shl-10', level: 15, cup: 'DEL2 Championship', logo: LG + 'deutsche_eishockey_liga_-_2.png', conferences: [], divisions: [], rounds: ["Pre-Playoffs", "Quarterfinal", "Semifinal", "DEL2 Final"], teams: del2Teams },
  ALPS: { abbr: 'AlpsHL', name: 'Alps Hockey League', label: 'AlpsHL', country: 'AUT', tier: 2, kind: 'pro', games: 36, playoffSpots: 8, playoffFormat: 'best-of-7-8', level: 19, cup: 'Alps Hockey League Championship', logo: LG + 'alps_hockey_league.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "AlpsHL Final"], teams: alpsTeams },
  MAGNUS: { abbr: 'Magnus', name: 'Ligue Magnus', label: 'Ligue Magnus', country: 'FRA', tier: 1, kind: 'pro', games: 44, playoffSpots: 8, playoffFormat: 'best-of-7-8', level: 19, cup: 'Coupe Magnus', logo: LG + 'ligue_magnus.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Coupe Magnus Final"], teams: magnusTeams },
  EIHL: { abbr: 'EIHL', name: 'Elite Ice Hockey League', label: 'EIHL', country: 'GBR', tier: 1, kind: 'pro', games: 54, playoffSpots: 8, playoffFormat: 'eihl-8', level: 19, cup: 'EIHL Playoff Championship', logo: LG + 'elite_ice_hockey_league.png', conferences: [], divisions: [], rounds: ["Quarterfinal", "Semifinal", "Playoff Final"], teams: eihlTeams },
  VHL: { abbr: 'VHL', name: 'Supreme Hockey League', label: 'VHL', country: 'RUS', tier: 2, kind: 'pro', games: 52, playoffSpots: 16, playoffFormat: 'best-of-7-16', level: 14, cup: 'Bratina Cup', logo: LG + 'vysshaya_hokkeinaya_liga.png', conferences: [], divisions: [], rounds: ["First Round", "Quarterfinal", "Semifinal", "Bratina Cup Final"], teams: vhlTeams },
  MHL: { abbr: 'MHL', name: 'Junior Hockey League', label: 'MHL', country: 'RUS', tier: 0, kind: 'junior', games: 60, playoffSpots: 16, playoffFormat: 'best-of-5-16', level: 20, cup: 'Kharlamov Cup', parent: 'KHL', logo: LG + 'molodyozhnaya_hokkeinaya_liga.png', conferences: ["West", "East"], divisions: [], rounds: ["First Round", "Quarterfinal", "Semifinal", "Kharlamov Cup Final"], teams: mhlTeams },
  AIHL: { abbr: 'AIHL', name: 'Australian Ice Hockey League', label: 'AIHL', country: 'AUS', tier: 1, kind: 'pro', games: 28, playoffSpots: 4, playoffFormat: 'aihl-4', level: 27, cup: 'Goodall Cup', logo: LG + 'australian_ice_hockey_league.png', conferences: [], divisions: [], rounds: ["Semifinal", "Goodall Cup Final"], teams: aihlTeams }
};
