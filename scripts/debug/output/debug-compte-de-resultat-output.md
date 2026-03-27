
Chargement du dossier cmmjoradm0001kohp15on2xe1ÔÇª
Donn├®es charg├®es. Calculs en coursÔÇª
buildCompteResultatRows {
  rows: {
    caRows: [ [Object], [Object], [Object] ],
    achatsRows: [ [Object], [Object], [Object] ],
    achatsPonctuelsRows: [ [Object], [Object], [Object] ],
    commissionRows: [],
    reprisesRows: [],
    fournituresRows: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    servicesRows: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object]
    ],
    impotsRows: [ [Object], [Object] ],
    salaireRows: [],
    dirigeantRows: [ [Object] ],
    cotisationsRows: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object]
    ],
    taxesSalairesRows: [],
    dotationsParImmoData: [
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object],
      [Object], [Object]
    ],
    dotParNature: { CORPOREL: [Array], INCORPOREL: [Array], FINANCIER: [Array] },
    dotCorporel: {
      y1: 3494.8000000000006,
      y2: 3494.8000000000006,
      y3: 3494.8000000000006
    },
    dotIncorporel: { y1: 0, y2: 0, y3: 0 },
    dotFinancier: { y1: 120, y2: 120, y3: 120 },
    interetsParEmprunt: [ [Object] ],
    fraisDossierParEmprunt: [ [Object] ],
    autresChargesFinRows: [],
    provisionsRows: [],
    chargesGestionRows: [],
    prodFinRows: [],
    prodExcepRows: [],
    chargesExcepRows: []
  },
  nodes: [
    {
      key: 'prod_expl_header',
      label: "PRODUITS D'EXPLOITATION",
      values: [Object],
      children: undefined,
      style: 'section',
      hideIfZero: false
    },
    {
      key: 'ca',
      label: "Chiffre d'affaires",
      values: [Object],
      children: [Array],
      style: 'total',
      hideIfZero: false
    },
    {
      key: 'total_prod_expl',
      label: "Total des produits d'exploitation",
      values: [Object],
      children: undefined,
      style: 'total',
      hideIfZero: false
    },
    {
      key: 'charges_expl_header',
      label: "CHARGES D'EXPLOITATION",
      values: [Object],
      children: undefined,
      style: 'section',
      hideIfZero: false
    },
    {
      key: 'achats',
      label: 'Achats effectu├®s de mati├¿res / marchandises',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'variation_stock',
      label: 'Variation de stocks',
      values: [Object],
      children: undefined,
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'fournitures',
      label: 'Fournitures consommables',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'services',
      label: 'Services ext├®rieurs',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'charges_ext',
      label: 'Charges externes (Total)',
      values: [Object],
      children: undefined,
      style: 'total',
      hideIfZero: false
    },
    {
      key: 'impots_taxes',
      label: 'Imp├┤ts et taxes',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'salaires_bruts',
      label: 'Salaires bruts (Salari├®s)',
      values: [Object],
      children: [],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'charges_sociales',
      label: 'Charges sociales (Salari├®s)',
      values: [Object],
      children: undefined,
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'remunerations_dir',
      label: 'R├®mun├®ration du dirigeant',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'cotisations_tns',
      label: 'Cotisations TNS',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'taxes_salaires',
      label: 'Taxes assises sur les salaires',
      values: [Object],
      children: [],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'charges_personnel',
      label: 'Charges de personnel (Total)',
      values: [Object],
      children: undefined,
      style: 'total',
      hideIfZero: false
    },
    {
      key: 'dotations_amort',
      label: 'Dotations aux amortissements',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'total_charges_expl',
      label: "Total des charges d'exploitation",
      values: [Object],
      children: undefined,
      style: 'total',
      hideIfZero: false
    },
    {
      key: 'res_expl',
      label: "R├®sultat d'exploitation",
      values: [Object],
      children: undefined,
      style: 'result',
      hideIfZero: false
    },
    {
      key: 'charges_fin',
      label: 'Charges financi├¿res (dont int├®r├¬ts emprunts)',
      values: [Object],
      children: [Array],
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'res_fin',
      label: 'R├®sultat financier',
      values: [Object],
      children: undefined,
      style: 'result',
      hideIfZero: false
    },
    {
      key: 'res_courant',
      label: 'R├®sultat courant avant imp├┤t',
      values: [Object],
      children: undefined,
      style: 'result',
      hideIfZero: false
    },
    {
      key: 'is',
      label: 'Imp├┤t sur les b├®n├®fices (IS)',
      values: [Object],
      children: undefined,
      style: 'normal',
      hideIfZero: true
    },
    {
      key: 'res_net',
      label: "R├®sultat de l'exercice",
      values: [Object],
      children: undefined,
      style: 'result',
      hideIfZero: false
    }
  ]
}
