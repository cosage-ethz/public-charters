// Français (Suisse, vouvoiement). Mêmes clés que lang/en.js.
// Brouillon : à faire relire par une personne de langue maternelle française avant la publication.
window.I18N = window.I18N || {};
window.I18N.fr = {
  brand: { kicker: 'Constitutional AI Project', name: 'public charters' },
  nav: { take: 'Participer', results: 'Résultats', charter: 'La charte', about: 'À propos', language: 'Langue' },
  common: {
    student: 'Un projet d’étudiant·es de l’ETH Zurich. Ni géré par la Swiss AI Initiative, ni lié à elle.',
    sample: 'Tour d’exemple',
    sampleNote: 'Tant qu’il n’y a pas assez de vraies réponses, les résultats incluent 140 participant·es fictifs. Vos propres réponses s’y ajoutent.',
    back: 'Retour', next: 'Suivant', skip: 'Passer', close: 'Fermer', cancel: 'Annuler',
    article: 'Article {n}', clause: 'Phrase {n}',
    charterLink: 'https://apertus-ai.org/pages/charter/',
    footer: 'Public Charters · AI and Human Values, ETH Zurich, 2026. Sans lien avec la Swiss AI Initiative. Source de la charte : <a href="https://apertus-ai.org/pages/charter/" target="_blank" rel="noopener">apertus-ai.org</a> (en anglais) · Code : <a href="https://github.com/cosage-ethz/public-charters" target="_blank" rel="noopener">GitHub</a>'
  },
  status: {
    endorsed: 'La plupart sont pour', contested: 'Les avis sont partagés', weak: 'Pas assez de soutien', needs: 'Il faut plus de réponses'
  },
  answer: { yes: 'Oui, mieux', partly: 'En partie', no: 'Non' },

  home: {
    title: 'Public Charters · Écrire les règles de l’IA',
    h: 'L’IA suit des règles. <em>Aidez à les écrire.</em>',
    lede: 'Apertus, le modèle d’IA ouvert de la Suisse, suit quelques règles : la Charte Apertus. Dites-nous comment elles devraient changer.',
    cta: 'Participer · environ 10 minutes',
    ctaRead: 'Lire la charte',
    ctaNote: 'Pas besoin de mot de passe.',
    demoToday: 'Aujourd’hui',
    demoSuggested: 'Proposé par des participant·es',
    demoCap: 'Une phrase, bien des lectures. Laquelle choisiriez-vous ?',
    stepsH: 'Comment ça marche',
    s1h: 'Lire', s1: 'Une proposition de changement d’une phrase, avec un exemple.',
    s2h: 'Évaluer', s2: 'Mieux, en partie ou non ? Un clic.',
    s3h: 'Proposer', s3: 'Facultatif : réécrire vous-même une phrase.',
    flowH: 'De vos réponses à un modèle vérifiable',
    f1k: 'Recueillir', f1h: 'Vos évaluations et idées', f1: 'Chaque voix compte autant. Seuls les totaux sont affichés.',
    f2k: 'Décider', f2h: 'Un large soutien', f2: 'Un changement passe quand nettement plus de personnes disent oui que non.',
    f3k: 'Entraîner', f3h: 'Une nouvelle version', f3: 'Nous entraînons une petite copie d’Apertus avec les changements retenus.',
    f4k: 'Vérifier', f4h: 'Un bilan public', f4: 'Nous la testons sur de nouvelles questions et publions si elle a vraiment changé.',
    explainEyebrow: 'En bref',
    explainH: 'Qu’est-ce qu’une charte d’IA ?',
    e1h: 'Ce que c’est', e1: 'Un court texte de règles sur la façon dont une IA doit se comporter : être honnête, éviter de nuire, respecter les choix des gens.',
    e2h: 'À quoi ça sert', e2: 'L’IA est entraînée à la suivre. Elle détermine donc pour quoi l’IA aide, ce qu’elle refuse et comment elle vous parle.',
    e3h: 'Pourquoi les mots comptent', e3: 'Tout le monde est d’accord pour « éviter de nuire ». Quelques mots décident de ce que cela veut dire en pratique, et c’est là que les avis divergent.',
    whoH: 'Qui en utilise ?',
    whoP: 'Beaucoup de fabricants d’IA publient les règles que suivent leurs modèles, sous différents noms.',
    apertusDoc: 'Charte Apertus', apertusBy: 'Swiss AI Initiative · Apertus', apertusD: 'Le modèle ouvert de la Suisse. 11 articles, de l’honnêteté au contrôle humain.',
    anthropicDoc: 'Claude’s constitution (constitution)', anthropicBy: 'Anthropic · Claude', anthropicD: 'Les valeurs et le caractère qu’Anthropic souhaite pour Claude. Utilisée pour l’entraînement.',
    openaiDoc: 'Model Spec', openaiBy: 'OpenAI · ChatGPT', openaiD: 'Comment OpenAI veut que ses modèles se comportent, par exemple ceux de ChatGPT.',
    read: 'Lire (en anglais)',
    whoNote: 'Ces textes sont écrits par les entreprises elles-mêmes. Public Charters pose la question : et si les personnes qui utilisent l’IA avaient leur mot à dire ?',
    kitH: 'Le faire pour votre propre IA et communauté',
    kit: 'Un hôpital, une école ou une commune peut mener la même démarche pour sa propre IA et ses propres règles, sur son propre site.',
    kitLink: 'Le Charter Kit gratuit'
  },

  take: {
    title: 'Participer',
    h: 'Aidez à décider comment <em>Apertus doit se comporter.</em>',
    lede: 'Évaluez quelques propositions de changement de la charte. Si vous le souhaitez, proposez-en une vous-même. Faites-en autant ou aussi peu que vous voulez.',
    steps: { join: 'Début', rate: 'Évaluer', propose: 'Proposer', done: 'Terminé' }
  },
  join: {
    eyebrow: 'Avant de commencer',
    h: 'Ce que vous allez faire',
    p1: '<b>Évaluer des changements.</b> Vous lisez une proposition de changement d’une phrase de la charte, avec un exemple de ce qu’elle voudrait dire. Vous dites si elle améliore la charte. Environ 1 minute chacune.',
    p2: '<b>Proposer le vôtre,</b> si vous le souhaitez.',
    p3: '<b>Vos réponses sont anonymes.</b> Nous ne montrons que des totaux, jamais qui a dit quoi.',
    p4: '<b>Ceci est un projet d’étudiant·es.</b> Il ne modifie pas l’Apertus officiel. Nous testons les changements les plus soutenus sur une petite copie et publions les résultats.',
    signin: 'Pour que vos réponses comptent, connectez-vous avec votre e-mail. Nous vous envoyons un lien, pas besoin de mot de passe.',
    signinBtn: 'Se connecter',
    joinBtn: 'Participer',
    notMember: 'Vous êtes connecté·e en tant que {email}.',
    signedIn: 'Connecté·e en tant que {email}.',
    sampleNote: '<b>Tour d’exemple.</b> 140 personnes fictives ont déjà répondu. Vos réponses restent dans ce navigateur et s’ajoutent aux leurs.',
    startOver: 'Recommencer',
    optional: 'Facultatif · 3 questions',
    optionalWhy: 'Elles nous permettent par exemple de montrer si les jeunes et les aînés voient un changement différemment. Les groupes de moins de 5 personnes ne sont jamais affichés.',
    preferNot: 'Je préfère ne pas répondre',
    consent: 'Je comprends comment mes réponses sont utilisées et je souhaite participer.',
    tick: 'Cochez la case pour continuer',
    start: 'Commencer'
  },
  demo: {
    age: { q: 'Âge', o: { u25: 'Moins de 25 ans', a25: '25 à 44 ans', a45: '45 à 64 ans', a65: '65 ans ou plus' } },
    lang: { q: 'Langue principale', o: { de: 'Allemand', fr: 'Français', it: 'Italien', rm: 'Romanche', en: 'Anglais', other: 'Autre' } },
    ai: { q: 'À quelle fréquence utilisez-vous des chatbots d’IA ?', o: { daily: 'Chaque jour', weekly: 'Chaque semaine', rarely: 'Rarement', never: 'Jamais' } },
    by: 'Par âge, langue et utilisation de l’IA',
    notEnough: 'Pas encore assez de réponses pour afficher quelque chose.',
    hidden: '{n} autres dans des groupes de moins de 5 personnes, non affichés.'
  },
  rate: {
    eyebrow: 'Changement {i} sur {n}',
    q: 'Ce changement améliorerait-il la charte ?',
    current: 'La phrase aujourd’hui',
    changed: 'Avec le changement',
    legend: '<del>barré</del> = supprimé · <ins>surligné</ins> = nouveau',
    why: 'Pourquoi quelqu’un le propose',
    example: 'Un exemple',
    asks: 'Quelqu’un demande :',
    today: 'Aujourd’hui, l’IA pourrait :',
    after: 'Avec le changement :',
    note: 'Remarque d’un·e spécialiste · {who}',
    others: 'Jusqu’ici : {yes} oui, {partly} en partie, {no} non ({n} réponses).',
    others_one: 'Jusqu’ici : {yes} oui, {partly} en partie, {no} non (1 réponse).',
    count: 'Vous en avez évalué {n}. Une dizaine, c’est une bonne contribution.',
    count_one: 'Vous en avez évalué 1. Une dizaine, c’est une bonne contribution.',
    earlier: 'Votre réponse précédente : {a}. Cliquez à nouveau pour la changer.',
    skipLink: 'Pas sûr·e ? Passer celle-ci →',
    prev: '← Précédent',
    nextChange: 'Changement suivant →',
    toPropose: 'Étape suivante : proposer le vôtre →',
    improveH: 'Comment écririez-vous cette phrase pour l’améliorer ?',
    improveP: 'Modifiez le texte ci-dessous. Les autres évalueront aussi votre version.',
    improveSend: 'Envoyer ma version',
    improveSame: 'Modifiez d’abord quelque chose dans le texte.',
    improveDone: 'Merci ! Votre version est enregistrée, et les autres peuvent maintenant l’évaluer.',
    toProposeNote: 'Ensuite, l’étape 3 : proposer votre propre changement. Vous pouvez revenir à l’évaluation à tout moment.',
    allDone: 'Vous avez vu tous les changements. Merci !'
  },
  propose: {
    eyebrow: 'Facultatif',
    h: 'Proposer votre propre changement',
    intro: 'Une phrase est floue, trop stricte ou incomplète ? Écrivez votre propre version.',
    step1: 'Choisir une phrase', step2: 'Écrire votre version', step3: 'Les autres l’évaluent',
    tip: 'Astuce : sélectionnez quelques mots dans une phrase pour ne modifier que ceux-là.',
    mapH: 'Où cela se situe dans la charte',
    mapP: 'La Charte Apertus compte 11 articles. Ce tour porte sur les 3 en couleur.',
    inRound: 'Dans ce tour', notInRound: 'Pas dans ce tour',
    sentences: '{n} phrases', sentences_one: '1 phrase',
    change: 'Modifier',
    mine: 'Vos propositions',
    waiting: 'En attente d’évaluations.',
    finish: 'Terminer →'
  },
  charterMap: [
    ['Qualité des réponses', 'Des réponses claires, exactes et utiles.'],
    ['Connaissances et raisonnement', 'S’appuyer sur des faits vérifiés et un raisonnement solide.'],
    ['Communication respectueuse', 'Traiter chacun avec courtoisie, équité et accessibilité.'],
    ['Prévenir les dommages', 'Protéger la sécurité et refuser les demandes nuisibles.'],
    ['Résoudre les conflits de valeurs', 'Assumer ouvertement les compromis et préserver les principes.'],
    ['Limites du conseil professionnel', 'Expliquer, sans donner de conseil médical, juridique ou financier.'],
    ['Décisions collectives', 'Soutenir des décisions de groupe justes et constructives.'],
    ['Autonomie et limites personnelles', 'Respecter les choix, la vie privée et des limites claires.'],
    ['Long terme et durabilité', 'Tenir compte des impacts et des risques à long terme.'],
    ['Capacité d’agir humaine', 'Garder les humains aux commandes et indépendants.'],
    ['Identité et limites de l’IA', 'Dire clairement ce que l’IA est et n’est pas.']
  ],
  done: {
    h: 'Merci !',
    p: 'Vous avez évalué {n} changements. Vos réponses figurent déjà dans les résultats.',
    p_one: 'Vous avez évalué 1 changement. Votre réponse figure déjà dans les résultats.',
    proposed: 'Vous avez aussi proposé {n} changements vous-même.',
    proposed_one: 'Vous avez aussi proposé un changement vous-même.',
    next: 'La suite',
    n1: 'À la fin du tour, chaque changement reçoit un résultat : la plupart sont pour, les avis sont partagés, ou pas assez de soutien.',
    n2: 'Les changements que la plupart soutiennent forment une nouvelle version de la charte.',
    n3: 'Nous entraînons une petite copie d’Apertus avec la nouvelle version et vérifions si ses réponses changent vraiment. Nous publions les résultats.',
    results: 'Voir les résultats →',
    more: 'Évaluer d’autres changements'
  },

  form: {
    h: 'Proposer un changement',
    what: 'Que voulez-vous faire des mots marqués ?',
    replace: 'Les remplacer', remove: 'Les supprimer', add: 'Ajouter des mots après', addHere: 'Ajouter des mots ici',
    newText: 'Votre formulation',
    newTextPh: 'Les mots que vous utiliseriez à la place',
    why: 'Pourquoi ? (facultatif, mais cela aide les autres à décider)',
    whyPh: 'Quel problème cela résout-il ? Qui est concerné ?',
    submit: 'Envoyer la proposition',
    needText: 'Écrivez votre formulation, ou choisissez « Les supprimer ».',
    sentLive: 'Merci ! Les autres peuvent maintenant évaluer votre proposition.',
    sentSample: 'Enregistrée dans ce navigateur (tour d’exemple). Elle attend maintenant des évaluations.',
    signFirst: 'Veuillez d’abord vous connecter.',
    joinFirst: 'Veuillez d’abord participer, sur la page « Participer ».',
    notInCharter: 'La phrase {n} ne fait pas partie de cette charte.',
    selBtn: 'Proposer un changement',
    bridge: 'Les avis sur ce changement sont partagés. Trouvez-vous une formulation acceptable pour les deux camps ?'
  },
  acct: {
    sample: 'Tour d’exemple', sampleTip: 'Aucune base de données connectée. Vos réponses restent dans ce navigateur.',
    proposals: 'Propositions', signin: 'Se connecter', signout: 'Se déconnecter', join: 'Participer', organise: 'Organiser', invite: 'Inviter des personnes',
    signinH: 'Se connecter', signinP: 'Nous vous envoyons un lien par e-mail. Pas besoin de mot de passe.', email: 'E-mail', send: 'Envoyer le lien',
    checkH: 'Consultez vos e-mails', checkP: 'Nous avons envoyé un lien à {email}. Ouvrez-le sur cet appareil.',
    signinPropose: 'Connectez-vous pour proposer un changement. Nous vous envoyons un lien.',
    invited: 'Vous avez été invité·e à participer. Connectez-vous avec votre e-mail pour accepter.',
    welcome: 'Bienvenue ! Vous participez maintenant à : {name}.', joined: 'Vous participez maintenant à : {name}.',
    listH: 'Propositions', listNone: 'Aucune proposition pour l’instant. Sélectionnez des mots dans une phrase pour proposer un changement.',
    listSample: 'Tour d’exemple : vos propositions sont enregistrées uniquement dans ce navigateur.',
    listLive: '{n} propositions, les plus récentes d’abord.', listLive_one: '1 proposition.',
    cannotSee: 'Connectez-vous pour voir les propositions.', clear: 'Effacer',
    joinOpen: 'Veuillez d’abord participer (en haut à droite).', inviteOnly: 'On ne peut participer ici que sur invitation.',
    saveError: 'Échec de l’enregistrement : {msg}'
  },

  results: {
    title: 'Résultats',
    h: 'Ce que les gens <em>pensent jusqu’ici.</em>',
    lede: 'Comment les gens ont évalué chaque proposition de changement. Ici, ce sont des personnes qui décident, pas une IA.',
    howH: 'Comment nous comptons',
    how1: 'Chaque réponse compte autant : <b>oui</b> +1, <b>en partie</b> 0, <b>non</b> −1.',
    how2: '<b>La plupart sont pour :</b> nettement plus de oui que de non, sur au moins 10 réponses.',
    how3: '<b>Les avis sont partagés :</b> au moins 30 % de oui et au moins 30 % de non.',
    how4: 'L’âge, la langue et l’utilisation de l’IA montrent seulement comment les groupes ont répondu. Ils ne décident jamais.',
    howNote: 'Une première version : ces seuils peuvent changer quand de vraies réponses arriveront. En détail : oui compte +1, en partie 0, non −1, et « la plupart sont pour » signifie une moyenne d’au moins +0,3.',
    statsLine: '{p} personnes · {a} réponses · {c} propositions',
    filterHint: 'Cliquez sur une couleur pour n’afficher que ces changements.',
    listH: 'Tous les changements, les plus soutenus d’abord',
    listHint: 'Faites défiler toutes les propositions. Ouvrez « Par âge, langue et utilisation de l’IA » sur une carte pour voir comment les groupes ont répondu.',
    fringeH: 'Des idées portées par certains groupes',
    fringeP: 'Toutes les idées ne gagnent pas une majorité. Ces changements sont soutenus par la plupart des personnes d’un groupe, même si la majorité dans l’ensemble n’est pas (encore) d’accord. Ils restent visibles, pour que les voix minoritaires ne se perdent pas.',
    fringeAll: 'Tout le monde',
    fringeNone: 'Aucun groupe ne se distingue pour l’instant.',
    fringePeople: '{n} personnes',
    axisNo: 'non',
    axisYes: 'oui',
    removeW: 'Supprimer « {w} »',
    all: 'Toutes',
    line: '{yes} oui · {partly} en partie · {no} non · {n} réponses',
    yours: 'Votre proposition',
    rateIt: 'L’évaluer',
    showAll: 'Afficher les {n}',
    none: 'Rien pour l’instant.',
    nextH: 'La suite',
    next1h: 'Le tour se termine', next1: 'Chaque changement reçoit son résultat.',
    next2h: 'Une nouvelle version', next2: 'Les changements que la plupart soutiennent entrent dans une nouvelle version de la charte.',
    next3h: 'Un test', next3: 'Nous entraînons une petite copie d’Apertus avec et la testons sur de nouvelles questions.',
    next4h: 'Un rapport', next4: 'Nous publions si ses réponses ont vraiment changé.'
  },

  about: {
    title: 'À propos',
    h: 'À propos <em>de ce projet.</em>',
    lede: 'Qui nous sommes, ce que nous faisons de vos données, et la recherche derrière ce projet.',
    official: '<b>Il ne modifie pas l’Apertus officiel.</b> Nous testons les résultats sur notre propre petite copie.',
    sample: '<b>Des données d’exemple pour l’instant :</b> tant qu’il n’y a pas assez de participant·es, les résultats incluent des réponses inventées, clairement signalées.',
    dataH: 'Vos données',
    data1: 'Nous n’avons besoin que de votre e-mail pour vous connecter. Nous ne le montrons jamais.',
    data2: 'L’âge, la langue et l’utilisation de l’IA sont facultatifs, et affichés seulement en totaux pour des groupes d’au moins 5 personnes.',
    data3: 'Nous ne montrons jamais qui a répondu quoi.',
    data4: 'Quelqu’un ayant plusieurs adresses e-mail pourrait répondre deux fois. Nous l’acceptons plutôt que de demander plus de données.',
    whoH: 'Qui sommes-nous',
    who: 'Des étudiant·es du cours « AI and Human Values » à l’ETH Zurich (automne 2026). Ni géré par la Swiss AI Initiative, ni lié à elle.',
    researchH: 'La recherche derrière le projet',
    researchP: 'Pour celles et ceux qui veulent en savoir plus : les idées sur lesquelles s’appuie ce projet (sources en anglais).',
    src: {
      cca: 'Environ 1000 personnes aux États-Unis ont écrit des règles pour une IA et voté sur ces règles ; l’IA a ensuite été entraînée avec.',
      notes: 'Un système d’évaluation où une note ne compte que si des personnes habituellement en désaccord la trouvent toutes utiles.',
      polis: 'Un outil qui montre où des groupes de personnes sont d’accord ou non.',
      dp: 'Les personnes reçoivent une information équilibrée et discutent avant de donner leur avis.',
      prism: 'Ce que les gens disent attendre d’une IA et la façon dont ils évaluent de vraies réponses peuvent différer ; les deux comptent.',
      sc: 'Entraîner une IA avec les avis de nombreuses personnes est déjà une sorte de vote ; il faut donc la concevoir comme tel.',
      apertus: 'Le modèle et sa charte.',
      charter: 'La charte dont part ce projet.'
    }
  },

  viewer: {
    title: 'La Charte Apertus',
    h: 'La Charte <em>Apertus.</em>',
    lede: 'Les passages en couleur sont ceux où des gens proposent des changements. Cliquez dessus pour voir les idées et leurs évaluations.',
    notice: '<b>Données d’exemple.</b> Phrases raccourcies et traduites de la version 1.0 de la <a href="https://apertus-ai.org/pages/charter/" target="_blank" rel="noopener">Charte Apertus</a> (en anglais) ; 3 de ses 11 articles sont affichés. Les propositions et évaluations sont inventées pour l’instant.',
    legend: 'La couleur montre l’idée la mieux notée pour chaque passage :',
    emptyH: 'Choisissez un passage en couleur',
    empty: 'Vous verrez toutes les propositions de changement et comment elles ont été évaluées.',
    summary: '{p} passages avec propositions · {c} idées au total',
    ideas: '{n} propositions de changement', ideas_one: '1 proposition de changement',
    today: 'Aujourd’hui', added: 'Des mots ajoutés ici', remove: 'Supprimer ces mots',
    rateThese: 'Les évaluer', suggest: 'Proposer le vôtre'
  },

  // Données d'exemple (sample-data.js), traduites. Par changement : [texte, raison, citation, question, aujourd'hui, avec le changement].
  sample: {
    groups: { r: { title: 'Lectures', unit: 'contributions' }, c: { title: 'Communautés', unit: 'membres' } },
    versions: {
      c: { name: 'Le soin d’abord', d: 'Prévenir les dommages tôt, même au prix d’un peu de confort.' },
      a: { name: 'À vous de décider', d: 'Traiter les gens comme des adultes capables de faire leurs propres choix.' },
      h: { name: 'Des personnes responsables', d: 'Garder une personne responsable dans chaque décision importante.' },
      o: { name: 'Montrer le raisonnement', d: 'Rendre chaque limite visible et contestable.' },
      g1: { name: 'Personnel hospitalier', d: 'Médecins, soignant·es et aides qui utilisent l’IA au travail.' },
      g2: { name: 'Corps enseignant', d: 'Enseignant·es du secondaire qui travaillent avec des mineurs.' },
      g3: { name: 'Romanchophones', d: 'Membres d’une petite communauté de langue nationale.' }
    },
    arts: {
      a4: { t: 'Prévenir les dommages', cl: {
        '4.1': ['L’IA doit ', { h: 'h1' }, ' ', { h: 'h2' }, ' pour le bien-être humain.'],
        '4.2': ['La sécurité humaine doit toujours primer sur les considérations abstraites ou théoriques', { h: 'h3' }, '.'],
        '4.3': ['Les demandes nuisibles ', { h: 'h4' }, { h: 'h5' }, '.'] } },
      a8: { t: 'Autonomie et limites personnelles', cl: {
        '8.1': ['L’IA doit préserver l’autonomie humaine en respectant la capacité d’agir individuelle et collective', { h: 'h6' }, '.'],
        '8.2': ['Les informations personnelles doivent être protégées en limitant la collecte de données et ', { h: 'h7' }, '.'],
        '8.3': ['Une limite claire doit être maintenue entre une aide utile et ', { h: 'h8' }, { h: 'h9' }, '.'] } },
      a10: { t: 'Capacité d’agir humaine', cl: {
        '10.1': ['L’IA doit garantir que le contrôle et le pouvoir de décision finaux ', { h: 'h10' }, '.'],
        '10.2': ['Le système doit se consacrer exclusivement à servir ', { h: 'h11' }, ', sans développer, suggérer ou exprimer d’intérêts propres, y compris toute forme d’instinct de conservation ou de recherche de pouvoir.'],
        '10.3': ['Les réponses doivent ', { h: 'h12' }, ' en ', { h: 'h13' }, '.'] } }
    },
    hots: {
      h1: { base: 'protéger activement contre', edits: [
        ['aider les personnes à se prémunir contre', '« Protéger » peut justifier de passer outre ce qu’une personne a choisi. Cette formulation lui laisse la décision.', 'J’ai demandé un itinéraire de randonnée risqué et j’ai reçu un sermon au lieu d’un itinéraire.', 'Je veux jeûner deux jours. Que devrais-je savoir ?', 'Met en garde, puis essaie peut-être de dissuader la personne.', 'Indique les principaux risques et répond à la question.']] },
      h2: { base: 'les menaces immédiates', edits: [
        ['les menaces immédiates et prévisibles', 'Un dommage qui s’installe lentement compte aussi, comme une semaine presque sans sommeil.', 'La plupart des dégâts que j’ai vus sont arrivés lentement, pas en un instant.', 'J’ai dormi trois heures par nuit toute la semaine. Comment rester éveillé ?', 'Donne des astuces pour rester éveillé.', 'Donne des astuces et signale le risque pour la santé.'],
        ['les menaces immédiates ou médicalement prévisibles', 'Le personnel veut que les premiers signes d’alerte soient pris aussi au sérieux que les urgences.', 'C’est aux premiers signes qu’on peut encore aider.', 'Ma mère semble confuse depuis qu’elle prend un nouveau médicament.', 'Suggère de demander à un médecin.', 'Signale une urgence possible et conseille de contacter un médecin aujourd’hui.']] },
      h3: { base: '', edits: [
        [', et l’IA doit dire quand elle applique cette règle', 'On ne peut pas contester une décision de sécurité qu’on ne voit pas.', 'Si elle retient quelque chose, je veux savoir qu’elle l’a fait.', 'Comment fonctionnent les crochets de serrurier ?', 'Donne une réponse plus courte sans dire pourquoi.', 'Dit qu’elle a limité sa réponse, et pourquoi.']] },
      h4: { base: 'doivent être refusées', edits: [
        ['ne doivent être refusées que si le dommage est évident', 'Refuser en bloc empêche des questions de sécurité ordinaires.', 'Elle a refusé de me dire quels produits d’entretien sont dangereux ensemble. C’est justement l’information qui protège les gens.', 'Quels produits ménagers ne faut-il jamais mélanger ?', 'Refuse peut-être.', 'Répond, car il s’agit d’une information de sécurité.'],
        ['doivent être refusées ou transmises à une personne qualifiée', 'Certaines demandes demandent un jugement humain, qu’un simple refus n’atteint jamais.', 'Un refus est une impasse. Quelqu’un devrait être joignable.', 'Je crois que l’enfant de mes voisins est maltraité. Que dois-je faire ?', 'Donne peut-être seulement des conseils généraux.', 'Indique le bon service à contacter.'],
        ['doivent être refusées, en indiquant la raison', 'Une raison donnée permet de corriger un refus erroné.', 'Dis-moi simplement pourquoi tu as dit non.', 'Écris-moi un faux certificat médical.', 'Refuse.', 'Refuse et dit où est le problème.'],
        ['doivent être refusées, avec une aide adaptée à l’âge pour les mineurs', 'Un simple refus peut laisser un jeune sans personne vers qui se tourner.', 'Les élèves demandent à une IA ce qu’ils ne me demanderaient pas.', 'Un élève demande à partir de quelle quantité l’alcool est dangereux.', 'Refuse peut-être.', 'Donne une information de sécurité adaptée à son âge et indique où trouver de l’aide.']] },
      h5: { base: ', même si elles semblent légitimes', edits: [
        ['', 'Ce passage rend suspectes des demandes plausibles, y compris honnêtes.', 'Une infirmière qui demande des doses dangereuses semble suspecte, mais elle fait son travail.', 'Je suis infirmière. À partir de quelle dose le paracétamol est-il dangereux ?', 'Refuse peut-être malgré le rôle indiqué.', 'Peut répondre avec la prudence nécessaire.']] },
      h6: { base: '', edits: [
        [', y compris celle des petites communautés linguistiques', 'Un droit collectif ne vaut pas grand-chose si l’IA ne sert bien que les grandes langues.', 'On nous demande de passer à l’allemand avant de nous aider.', 'Quelqu’un pose une question en romanche.', 'Répond peut-être en allemand.', 'Répond en romanche, ou dit clairement qu’elle ne le fait pas bien.']] },
      h7: { base: 'en exigeant un consentement explicite', edits: [
        ['en exigeant un consentement explicite avant de les conserver ou de les réutiliser', 'Le consentement doit couvrir ce qui arrive aux données plus tard, pas seulement le moment où on les partage.', 'J’ai dit oui pour une question, pas pour qu’on le garde pour toujours.', 'Utilise mon diagnostic pour adapter tes conseils à partir de maintenant.', 'On ne sait pas ce qui est conservé.', 'Demande avant de conserver quoi que ce soit et dit comment ce sera utilisé.'],
        ['en exigeant un consentement explicite, sans jamais permettre d’identifier un patient', 'En milieu médical, il faut une limite plus ferme qu’un consentement général.', 'Un résumé négligent peut permettre d’identifier quelqu’un dans un petit village.', 'Résume cette note de cas pour l’équipe.', 'Résume la note telle quelle.', 'Retire les détails qui pourraient permettre d’identifier le patient.']] },
      h8: { base: 'l’ingérence', edits: [
        ['le fait d’orienter le choix d’une personne', '« Ingérence » est vague. « Orienter » décrit le comportement qui dérange les gens.', 'J’ai demandé les avantages et les inconvénients. Elle m’a dit quoi faire.', 'Dois-je quitter mon emploi pour ouvrir une boulangerie ?', 'Penche peut-être vers l’option la plus sûre.', 'Présente les avantages et inconvénients et laisse le choix à la personne.']] },
      h9: { base: '', edits: [
        ['. L’IA doit dire quand une décision revient plutôt à une personne', 'Savoir quand se mettre en retrait est une compétence que l’IA devrait montrer ouvertement.', 'Un bon conseiller sait dire : ce n’est pas à moi de décider.', 'Devons-nous débrancher l’appareil qui maintient mon père en vie ?', 'Donne des considérations générales.', 'Dit que cela revient à la famille et aux médecins, puis propose son soutien.'],
        ['. Dans l’enseignement, l’IA doit soutenir la réflexion propre des élèves', 'Faire le travail à la place d’un élève est une ingérence, même s’il le demande.', 'L’aide devrait se terminer par un élève capable de le faire seul la prochaine fois.', 'Écris ma dissertation d’histoire.', 'Écrit la dissertation.', 'Aide l’élève à planifier et améliorer sa propre dissertation.']] },
      h10: { base: 'restent toujours aux humains', edits: [
        ['restent toujours à des personnes identifiées et responsables', '« Les humains », cela peut vouloir dire personne en particulier. Quelqu’un doit en répondre.', 'Quand quelque chose tourne mal, qui dois-je appeler ?', 'Classe ces patients par ordre de priorité de traitement.', 'Fournit un classement.', 'Apporte son aide et dit qui doit prendre la décision.'],
        ['restent toujours aux personnes concernées', 'Un contrôle détenu par une institution peut encore passer outre l’individu.', 'C’est ma vie, mes données et ma décision.', 'Dois-je montrer mon dossier médical à mon employeur ?', 'Énumère des considérations.', 'Traite le choix comme celui de la personne.'],
        ['restent toujours, dans les soins, à un professionnel de santé responsable', 'La responsabilité médicale ne peut pas être répartie sur un système.', 'C’est moi qui signe le dossier, donc la décision doit être la mienne.', 'Laquelle de ces deux doses est la bonne ?', 'Propose une réponse.', 'Montre son raisonnement et laisse la décision au professionnel.']] },
      h11: { base: 'des objectifs humains voulus', edits: [
        ['des objectifs humains voulus qui ne nuisent pas à autrui', 'Un objectif peut être voulu et nuire quand même à des tiers.', 'La personne qui l’utilise n’est pas la seule concernée.', 'Rédige un message pour pousser mon locataire à partir.', 'Le rédige peut-être.', 'Refuse la pression et propose une solution légale.']] },
      h12: { base: 'prévenir les dépendances malsaines', edits: [
        ['repérer les dépendances malsaines et y répondre avec tact', '« Prévenir » semble passif. L’IA devrait réagir quand elle voit ce schéma.', 'Ma mère lui parle plus qu’à nous tous.', 'Tu es la seule à qui je peux parler.', 'Répond chaleureusement et continue.', 'Répond chaleureusement et encourage à chercher d’autres soutiens.'],
        ['éviter de créer des dépendances malsaines', 'L’IA devrait surveiller son propre comportement, sans juger la façon dont vivent les adultes.', 'Je ne veux pas qu’un logiciel décide de ce qui est sain pour moi.', 'Je t’utilise pour planifier toute ma journée.', 'Suggère peut-être de moins compter sur elle.', 'Aide comme demandé et évite d’encourager davantage de dépendance.']] },
      h13: { base: 'soutenant l’indépendance humaine dans la prise de décision', edits: [
        ['expliquant leur raisonnement pour que chacun puisse le vérifier', 'L’indépendance grandit quand on peut suivre et vérifier une réponse.', 'Montre-moi les étapes et je pourrai juger le résultat moi-même.', 'Cette clause de contrat est-elle équitable ?', 'Donne un verdict.', 'Explique le raisonnement et ce qu’il faut vérifier.'],
        ['développant les compétences et le jugement propres des personnes', 'Pour les élèves, l’indépendance est quelque chose que l’IA devrait aider à développer.', 'Le but, c’est qu’ils aient moins besoin de moi chaque année.', 'Résous ce problème de maths.', 'Donne la solution.', 'Résout le problème avec l’élève, étape par étape.']] }
    },
    notes: {
      'h5-0': { by: 'Pharmacien', text: 'Une réponse sûre donne le seuil de danger général et précise que la limite exacte dépend du poids, de la fonction hépatique et d’autres médicaments, et qu’il faut la vérifier auprès d’une pharmacie.' },
      'h7-1': { by: 'Juriste en protection des données', text: 'Selon la loi suisse sur la protection des données, les données de santé sont des données personnelles sensibles, déjà soumises à des règles plus strictes que les autres.' },
      'h10-2': { by: 'Éthicien médical', text: 'La responsabilité incombe déjà légalement au soignant qui traite. Le changement le rend explicite pour l’IA, au lieu de créer une nouvelle règle.' }
    }
  }
};
