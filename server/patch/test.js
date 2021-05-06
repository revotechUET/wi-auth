let perm = require('../../server/utils/default-permission.json');
let e = [
    {
        displayAs: 'Well',
        name: 'well',
        get: perm['well.get'],
        create: perm['well.create'],
        update: perm['well.update'],
        delete: perm['well.delete']
    },
    {
        displayAs: 'Dataset',
        name: 'dataset',
        get: perm['dataset.get'],
        create: perm['dataset.create'],
        update: perm['dataset.update'],
        delete: perm['dataset.delete']
    },
    {
        displayAs: 'Curve',
        name: 'curve',
        get: perm['curve.get'],
        create: perm['curve.create'],
        update: perm['curve.update'],
        delete: perm['curve.delete']
    },
    {
        displayAs: 'Plot',
        name: 'plot',
        get: perm['dataset.get'],
        create: perm['plot.create'],
        update: perm['plot.update'],
        delete: perm['plot.delete']
    },
    {
        displayAs: 'Histogram',
        name: 'histogram',
        get: perm['histogram.get'],
        create: perm['histogram.create'],
        update: perm['histogram.update'],
        delete: perm['histogram.delete']
    },
    {
        displayAs: 'Cross Plot',
        name: 'cross-plot',
        get: perm['cross-plot.get'],
        create: perm['cross-plot.create'],
        update: perm['cross-plot.update'],
        delete: perm['cross-plot.delete']
    },
    {
        displayAs: 'Workflow',
        name: 'workflow',
        get: perm['workflow.get'],
        create: perm['workflow.create'],
        update: perm['workflow.update'],
        delete: perm['workflow.delete']
    },
    {
        displayAs: 'User Define Line',
        name: 'user-define-line',
        get: perm['user-define-line.get'],
        create: perm['user-define-line.create'],
        update: perm['user-define-line.update'],
        delete: perm['user-define-line.delete']
    },
    {
        displayAs: 'Marker Set Template',
        name: 'marker-set-template',
        get: perm['marker-set-template.get'],
        create: perm['marker-set-template.create'],
        update: perm['marker-set-template.update'],
        delete: perm['marker-set-template.delete']
    },
    {
        displayAs: 'Marker Set',
        name: 'marker-set',
        get: perm['marker-set.get'],
        create: perm['marker-set.create'],
        update: perm['marker-set.update'],
        delete: perm['marker-set.delete']
    },
    {
        displayAs: 'Marker',
        name: 'marker',
        get: perm['marker.get'],
        create: perm['marker.create'],
        update: perm['marker.update'],
        delete: perm['marker.delete']
    },
    {
        displayAs: 'Zone Set Template',
        name: 'zone-set-template',
        get: perm['zone-set-template.get'],
        create: perm['zone-set-template.create'],
        update: perm['zone-set-template.update'],
        delete: perm['zone-set-template.delete']
    },
    {
        displayAs: 'Zone Set',
        name: 'zone-set',
        get: perm['zone-set.get'],
        create: perm['zone-set.create'],
        update: perm['zone-set.update'],
        delete: perm['zone-set.delete']
    },
    {
        displayAs: 'Zone',
        name: 'zone',
        get: perm['zone.get'],
        create: perm['zone.create'],
        update: perm['zone.update'],
        delete: perm['zone.delete']
    },
    {
        displayAs: 'Image Set Template',
        name: 'image-set-template',
        get: perm['image-set-template.get'],
        create: perm['image-set-template.create'],
        update: perm['image-set-template.update'],
        delete: perm['image-set-template.delete']
    },
    {
        displayAs: 'Image Set',
        name: 'image-set',
        get: perm['image-set.get'],
        create: perm['image-set.create'],
        update: perm['image-set.update'],
        delete: perm['image-set.delete']
    },
    {
        displayAs: 'Image',
        name: 'image',
        get: perm['image.get'],
        create: perm['image.create'],
        update: perm['image.update'],
        delete: perm['image.delete']
    },
    {
        displayAs: 'Depth Track',
        name: 'depth-track',
        get: perm['depth-track.get'],
        create: perm['depth-track.create'],
        update: perm['depth-track.update'],
        delete: perm['depth-track.delete']
    },
    {
        displayAs: 'Track',
        name: 'track',
        get: perm['track.get'],
        create: perm['track.create'],
        update: perm['track.update'],
        delete: perm['track.delete']
    },
    {
        displayAs: 'Image Track',
        name: 'image-track',
        get: perm['image-track.get'],
        create: perm['image-track.create'],
        update: perm['image-track.update'],
        delete: perm['image-track.delete']
    },
    {
        displayAs: 'Zone Track',
        name: 'zone-track',
        get: perm['zone-track.get'],
        create: perm['zone-track.create'],
        update: perm['zone-track.update'],
        delete: perm['zone-track.delete']
    },
    {
        displayAs: 'Object Track',
        name: 'object-track',
        get: perm['object-track.get'],
        create: perm['object-track.create'],
        update: perm['object-track.update'],
        delete: perm['object-track.delete']
    },
    {
        displayAs: 'Rose Diagram Track',
        name: 'rose-diagram-track',
        get: perm['rose-diagram-track.get'],
        create: perm['rose-diagram-track.create'],
        update: perm['rose-diagram-track.update'],
        delete: perm['rose-diagram-track.delete']
    },
    {
        displayAs: 'Tadpole Track',
        name: 'tadpole-track',
        get: perm['tadpole-track.get'],
        create: perm['tadpole-track.create'],
        update: perm['tadpole-track.update'],
        delete: perm['tadpole-track.delete']
    }
]


const paramFullName = {
    DS: "Depth Shift",
    BLS: "Baseline Shift",
    TASK: "Task",
    CS: "Split Curve",
    PT: "Log-Plot Template",
    LOGPLOT_TEMPLATE_V2: 'Logplot Template V2',
    // LOGPLOT_TEMPLATE_H: 'Logplot Template V2 H',
    FT: "Workflow Template",
    FormulaArray: "User Defined Line",
    PALETTE: "PALETTE",
    MMSMODEL: "MMS Parameter Model",
    MMSINPUT: "MMS Parameter Input",
    HISTOGRAM: 'Histogram',
    CROSSPLOT: 'Crossplot',
    ZONEBACKUP: 'Zone set backup',
    MMSLabel: 'MMS Label',
};