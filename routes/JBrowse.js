var express = require('express')
var router = express.Router({ strict: true, mergeParams: true })
var config = require('../config')
var debug = require('debug')('p3api-server:route/JBrowse')
var RQLQueryParser = require('../middleware/RQLQueryParser')
var DecorateQuery = require('../middleware/DecorateQuery')
var PublicDataTypes = require('../middleware/PublicDataTypes')
var authMiddleware = require('../middleware/auth')
var APIMethodHandler = require('../middleware/APIMethodHandler')
var reqCounter = require('../middleware/ReqCounter')
var httpParams = require('../middleware/http-params')
var Limiter = require('../middleware/Limiter')

var apiRoot = config.get('jbrowseAPIRoot')
var distRoot = config.get('distributeURL')

function generateTrackList (req, res, next) {
  return JSON.stringify({
    'tracks': [
      {
        'type': 'SequenceTrack',
        'storeClass': 'p3/store/SeqFeatureREST',
        'baseUrl': apiRoot + '/genome/' + req.params.id,
        'key': 'Reference Sequence',
        'label': 'refseqs',
        'chunkSize': 20000,
        'maxExportSpan': 10000000,
        'region_stats': false,
        'pinned': true
      },
      {
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'storeClass': 'p3/store/SeqFeatureREST',
        'baseUrl': apiRoot + '/genome/' + req.params.id,
        'key': 'PATRIC Annotation',
        'label': 'PATRICGenes',
        'query': {
          annotation: 'PATRIC'
        },
        'style': {
          'showLabels': true,
          'showTooltips': true,
          'label': 'patric_id,gene',
          'color': '#17487d'
        },
        'glyph': 'function(feature) { return "JBrowse/View/FeatureGlyph/" + ( {"gene": "Gene", "mRNA": "ProcessedTranscript", "transcript": "ProcessedTranscript", "segmented": "Segments" }[feature.get("type")] || "Box" ) }',
        'subfeatures': true,
        'onClick': {
          'title': '{patric_id} {gene}',
          'label': "<div style='line-height:1.7em'><b>{patric_id}</b> | {refseq_locus_tag} | {alt_locus_Tag} | {gene}<br>{product}<br>{type}: {start} .. {end} ({strand})<br> <i>Click for detailed information</i></div>",
          'action': 'function(clickEvent){return window.featureDialogContent(this.feature);}'
        },
        'metadata': {
          'Description': 'PATRIC annotated genes'
        },
        'maxExportFeatures': 10000,
        'maxExportSpan': 10000000,
        'chunkSize': 100000,
        'region_stats': true
      },
      {
        'category': 'Gene and Protein',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'storeClass': 'p3/store/SeqFeatureREST',
        'baseUrl': apiRoot + '/genome/' + req.params.id,
        'query': {
          annotation: 'RefSeq'
        },
        'key': 'RefSeq Annotation',
        'label': 'RefSeqGenes',
        'style': {
          'showLabels': true,
          'showTooltips': true,
          'className': 'feature3',
          'label': 'refseq_locus_tag,gene,gene_id,protein_id,feature_type',
          'color': '#4c5e22'
        },
        'glyph': 'function(feature) { return "JBrowse/View/FeatureGlyph/" + ( {"gene": "Gene", "mRNA": "ProcessedTranscript", "transcript": "ProcessedTranscript", "segmented": "Segments" }[feature.get("type")] || "Box" ) }',
        'subfeatures': true,
        'onClick': {
          'title': '{refseq_locus_tag} {gene}',
          'label': "<div style='line-height:1.7em'><b>{refseq_locus_tag}</b> | {gene}<br>{product}<br>{type}: {start} .. {end} ({strand})<br> <i>Click for detailed information</i></div>",
          'action': 'function(clickEvent){return window.featureDialogContent(this.feature);}'
        },
        'metadata': {
          'Description': 'RefSeq annotated genes'
        },
        'maxExportFeatures': 10000,
        'maxExportSpan': 10000000,
        'region_stats': true
      }
    ],
    'names': {
      'url': 'names/',
      'type': 'REST'
    },
    'formatVersion': 1
  })
}

function generateSarsCov2TrackList (req, res, next) {
  return JSON.stringify({
    'formatVersion': 1,
    'names': {
      'type': 'REST',
      'url': 'names/'
    },
    'trackSelector': {
      'categoryOrder': 'Gene and Protein, Variants by WHO Name, Mutational Scanning (Bloom Lab), Functional Features, Epitopes, Structural Features, Primers and Probes, Natural Selection Heatmaps (Pond Lab), Positive Selection Sites (Pond Lab), Negative Selection Sites (Pond Lab), Drug Resistant Mutations'
    },
    'include': distRoot + 'content/jbrowse/sars_colors.conf',
    'tracks': [
      {
        'category': 'Gene and Protein',
        'baseUrl': apiRoot + '/genome/2697049.107626',
        'chunkSize': 20000,
        'key': 'Reference Sequence',
        'label': 'refseqs',
        'maxExportSpan': 10000000,
        'pinned': true,
        'region_stats': false,
        'storeClass': 'p3/store/SeqFeatureREST',
        'type': 'SequenceTrack'
      },
      {
        'category': 'Gene and Protein',
        'urlTemplate': distRoot + 'content/jbrowse/GCF_009858895.2_ASM985889v3_genomic.sorted.gff.gz',
        'glyph': 'function(feature) { return "JBrowse/View/FeatureGlyph/" + ( {"gene": "Gene", "mRNA": "ProcessedTranscript", "transcript": "ProcessedTranscript", "segmented": "Segments" }[feature.get("type")] || "Box" ) }',
        'key': 'RefSeq Annotation',
        'label': 'RefSeqGFF',
        'maxExportFeatures': 10000,
        'maxExportSpan': 10000000,
        'metadata': {
          'Description': 'RefSeq annotated genes'
        },
        'region_stats': true,
        'storeClass': 'p3/store/SeqFeatureREST',
        'style': {
          'className': 'feature3',
          'color': 'function(feature) { return feature.get("feature_type")=="CDS" ? "darkred" : "darkorange"; }',
          'label': 'product,protein_id,feature_type',
          'showLabels': true,
          'showTooltips': true
        },
        'subfeatures': true,
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'onClick': {
          'title': '{refseq_locus_tag} {gene}',
          'label': "<div style='line-height:1.7em'><b>{refseq_locus_tag}</b> | {gene}<br>{product}<br>{type}: {start} .. {end} ({strand})<br> <i>Click for detailed information</i></div>",
          'action': 'function(clickEvent){return window.featureDialogContent(this.feature);}'
        }
      },

      // ***************************************
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          {
            'url': distRoot + 'content/jbrowse/polyclonal_max.bw',
            'name': 'Polyclonal escape fraction maximum',
            'nonCont': true,
            'fill': true,
            'color': '#85C1E9'
          },
          {
            'url': distRoot + 'content/jbrowse/polyclonal_median.bw',
            'name': 'Polyclonal escape fraction median',
            'nonCont': true,
            'fill': true,
            'color':
            '#E59866'
          }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Polyclonal Sera Escape (Greaney 2021)',
        'label': 'Polyclonal Sera Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the human sera escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing human polyclonal serum.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the antibodies from human polyclonal plasma in vitro (PMID: 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          {
            'url': distRoot + 'content/jbrowse/LY-CoV016_max.bw',
            'name': 'Etesevimab escape fraction maximum',
            'nonCont': true,
            'fill': true,
            'color': '#85C1E9'
          },
          {
            'url': distRoot + 'content/jbrowse/LY-CoV016_median.bw',
            'name': 'Etesevimab escape fraction median',
            'nonCont': true,
            'fill': true,
            'color': '#E59866'
          }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Etesevimab Ab Escape (Starr 2021)',
        'label': 'Etesevimab Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of the overliad bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Eli Lilly Etesevimab therapuetic, which is the LYCoV016 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/REGN10933_max.bw', 'name': 'Casirivimab escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/REGN10933_median.bw', 'name': 'Casirivimab escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Casirivimab Ab Escape (Starr 2021)',
        'label': 'Casirivimab Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of overlaid the bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Regeneron Casirivimab therapuetic, which is the REGN10933 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/REGN10987_max.bw', 'name': 'Imdevimab escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/REGN10987_median.bw', 'name': 'Imdevimab escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Imdevimab Ab Escape (Starr 2021)',
        'label': 'Imdevimab Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Regeneron Imdevimab therapuetic, which is the REGN10987 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/REGN10933_REGN10987_max.bw', 'name': 'Casirivimab+Imdevimab cocktail escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/REGN10933_REGN10987_median.bw', 'name': 'Casirivimab+Imdevimab cocktail escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Casirivimab+Imdevimab Ab Cocktail Escape (Starr 2021)',
        'label': 'Casirivimab+Imdevimab Ab Cocktail Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Regeneron antibody cocktail, which contains the antibodies REGN10933+REGN10987.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the antibody cocktail in vitro (PMID: 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/LY-CoV555_max.bw', 'name': 'Bamlanivimab escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/LY-CoV555_median.bw', 'name': 'Bamlanivimab escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Bamlanivimab Ab Escape (Starr 2021)',
        'label': 'Bamlanivimab Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33655250, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Eli Lilly Bamlanivimab therapuetic, which is the LYCoV555 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33655250, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/LYCoV016_LYCoV555_max.bw', 'name': 'Etesevimab+Bamlanivimab escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/LYCoV016_LYCoV555_median.bw', 'name': 'Etesevimab+Bamlanivimab escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Etesevimab+Bamlanivimab Ab Cocktail Escape (Starr 2021)',
        'label': 'Etesevimab+Bamlanivimab Ab Cocktail Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33655250, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Eli Lilly antibody cocktail, which contains the antibodies LYCoV016+LYCoV555.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the antibody cocktail in vitro (PMID: 33655250, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/AZCoV22130_max.bw', 'name': 'AZD1061 escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/AZCoV22130_median.bw', 'name': 'AZD1061 escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'AZD1061 Ab Escape (Dong 2021)',
        'label': 'AZD1061 Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the AstraZeneca AZD1061 therapuetic, which is the COV2-2130 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33532768, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/AZCoV22196_max.bw', 'name': 'AZD8895 escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/AZCoV22196_median.bw', 'name': 'AZD8895 escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'AZD8895 Ab Escape (Dong 2021)',
        'label': 'AZD8895 Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the AstraZeneca AZD8895 therapuetic, which is the COV2-2196 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33532768, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/AZCoV22130_AZCoV22196_max.bw', 'name': 'AZD1061+AZD8895 escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/AZCoV22130_AZCoV22196_median.bw', 'name': 'AZD1061+AZD8895 escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'AZD1061+AZD8895 Ab Escape (Dong 2021)',
        'label': 'AZD1061+AZD8895 Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the AstraZeneca antibody cocktail, which contains the antibodies COV2-2130+COV2-2196.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the antibody cocktail in vitro (PMID: 33532768, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/COV2-2165_max.bw', 'name': 'COV2-2165', 'description': 'Class 1: COV2-2165 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/COV2-2196_norm_total.bw', 'name': 'COV2-2196', 'description': 'Class 1: COV2-2196 escape max (Dong 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/COV2-2832_max.bw', 'name': 'COV2-2832', 'description': 'Class 1: COV2-2832 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/C105_max.bw', 'name': 'C105', 'description': 'Class 1: C105 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/REGN10933_norm_total.bw', 'name': 'REGN10933', 'description': 'Class 1: REGN10933 escape (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/S2E12_max.bw', 'name': 'S2E12', 'description': 'Class 1: S2E12 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/S2H14_max.bw', 'name': 'S2H14', 'description': 'Class 1: S2H14 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/LY-CoV016_norm_total.bw', 'name': 'LY-CoV016', 'description': 'Class 1: LY-CoV016 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/COV2-2479_max.bw', 'name': 'COV2-2479', 'description': 'Class 2: COV2-2479 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/COV2-2050_max.bw', 'name': 'COV2-2050', 'description': 'Class 2: COV2-2050 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/COV2-2096_max.bw', 'name': 'COV2-2096', 'description': 'Class 2: COV2-2096 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/C002_max.bw', 'name': 'C002', 'description': 'Class 2: C002 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/C121_max.bw', 'name': 'C121', 'description': 'Class 2: C121 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/C144_max.bw', 'name': 'C144', 'description': 'Class 2: C144 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/LY-CoV555_norm_total.bw', 'name': 'LY-CoV555', 'description': 'Class 2: LY-CoV555 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/S2X16_max.bw', 'name': 'S2X16', 'description': 'Class 2: S2X16 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/S2H58_max.bw', 'name': 'S2H58', 'description': 'Class 2: S2H58 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/S2H13_max.bw', 'name': 'S2H13', 'description': 'Class 2: S2H13 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/S2D106_max.bw', 'name': 'S2D106', 'description': 'Class 2: S2D106 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/S2X58_max.bw', 'name': 'S2X58', 'description': 'Class 2: S2X58 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/COV2-2130_norm_total.bw', 'name': 'COV2-2130', 'description': 'Class 3: COV2-2130 escape max (Dong 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/COV2-2499_max.bw', 'name': 'COV2-2499', 'description': 'Class 3: COV2-2499 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/C110_max.bw', 'name': 'C110', 'description': 'Class 3: C110 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/C135_max.bw', 'name': 'C135', 'description': 'Class 3: C135 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/REGN10987_norm_total.bw', 'name': 'REGN10987', 'description': 'Class 3: REGN10987 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/S309_norm_total.bw', 'name': 'S309', 'description': 'Class 3: S309 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/S2X227_max.bw', 'name': 'S2X227', 'description': 'Class 3: S2X227 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/S2X259_max.bw', 'name': 'S2X259', 'description': 'Class 4: S2X259 escape max (Tortorici 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/S2X35_max.bw', 'name': 'S2X35', 'description': 'Class 4: S2X35 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/S304_max.bw', 'name': 'S304', 'description': 'Class 4: S304 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/S2H97_max.bw', 'name': 'S2H97', 'description': 'Class 4: S2H97 escape max (Starr 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/COV2-2094_max.bw', 'name': 'COV2-2094', 'description': 'Class 4: COV2-2094 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/COV2-2082_max.bw', 'name': 'COV2-2082', 'description': 'Class 4: COV2-2082 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' },
          { 'url': distRoot + 'content/jbrowse/COV2-2677_max.bw', 'name': 'COV2-2677', 'description': 'Class 4: COV2-2677 escape max (Greaney 2021)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '1000' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '80',
        'key': 'Bloom Lab Antibodies by Class',
        'label': 'Bloom Lab Antibodies by Class',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308).  This heatmap track analyzes mutational impact towards antibody binding for all monoclonal antibodies reported by the Jesse Bloom lab.  Since these monoclonal antibodies can be grouped by class, the antibodies are color coded by their class (PMID: 33045718).  The heat of each cell in this track denotes the normalized mutation impact sum (escape fraction) for all possible mutations at a particular site for a each antibody (PMID: 33592168). The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33532768, 33592168, 33495308, 33851154, 33758856).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/class1_max_total_track.bw', 'name': 'Class 1', 'description': 'ACE2 blocking antibodies that bind only to "up" RBDs (Barnes 2020)', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/class2_max_total_track.bw', 'name': 'Class 2', 'description': 'ACE2 blocking antibodies that bind to both "up", "down", and contanct adjacent RBDs (Barnes 2020)', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/class3_max_total_track.bw', 'name': 'Class 3', 'description': 'Antibodies binding outside the ACE2 site and to "up" and "down" RBDs (Barnes 2020)', 'nonCont': true, 'fill': true, 'color': '#85C0F9' },
          { 'url': distRoot + 'content/jbrowse/class4_max_total_track.bw', 'name': 'Class 4', 'description': 'Non-ACE2 blocking antibodies that bind only to "up" RBDs (Barnes 2020)', 'nonCont': true, 'fill': true, 'color': '#CCBE9F' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '90', 'textColor': '#FFFFFF' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '50',
        'key': 'Classes 1-4 Ab Escape',
        'label': 'Classes1to4AbEscape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308).  This heatmap track analyzes mutational impact towards antibody binding by class, where the class is defined by the structure of the antibody epitope (PMID: 33045718, 33758856).  Each of the four classes are comprised of multiple monoclonal antibodies, both therapuetic and non-therapuetic antibodies (those extracted from convalescent sera).  The heat at each site in this track denotes the maximum of the normalized mutation impact sum (escape fraction) among all antibodies within a class (PMID: 33592168). In other words, each cell within this heatmap represents the monoclonal antibody within the class that is most impacted by mutations overall at the particular site.  This way there is focus on the most vulnerable targets of SARS-CoV-2 RBD mutation.' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/ace2_binding_max.bw', 'name': 'ACE2 Binding Affinity', 'nonCont': true, 'fill': true, 'color': '#85C1E9' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100',
          'pos_color': 'blue',
          'neg_color': 'red'
        },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'ACE2 Binding Affinity (Starr 2020)',
        'label': 'ACE2 Binding Affinity',
        'type': 'JBrowse/View/Track/Wiggle/XYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the human sera escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308).  This particular track denotes the mutational impact towards ACE2 binding affinity.   in the positive region (blue) denote sites where a mutation can lead to increase in binding affinity, and bars in the negative region (red) denote sites where a mutation can lead to a decrease in binding affinity.  Note that each site only reports a positive binding affinity if the binding value was greater than or equal to 0.1, otherwise the minimum binding value is reported. Hence, all blue bars represent a maximum binding value at the site and all red bars represent a minimum binding value at the site (PMID: 32841599, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/S309_max.bw', 'name': 'VIR-7831 escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/S309_median.bw', 'name': 'VIR-7831 escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'VIR-7831 Ab Escape (Starr 2021)',
        'label': 'VIR-7831 Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the antibody escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33532768, 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing the Vir Biotechnology VIR-7831 therapuetic, which is the 5309 monoclonal antibody.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the monoclonal antibody in vitro (PMID: 33532768, 33592168, 33495308).' }
      },
      {
        'category': 'Mutational Scanning (Bloom Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/moderna_max.bw', 'name': 'Moderna escape fraction maximum', 'nonCont': true, 'fill': true, 'color': '#85C1E9' },
          { 'url': distRoot + 'content/jbrowse/moderna_median.bw', 'name': 'Moderna escape fraction median', 'nonCont': true, 'fill': true, 'color': '#E59866' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'max_score': '1',
        'colorizeAbout': 'true',
        'key': 'Moderna Ab Escape (Greaney 2021)',
        'label': 'Moderna Ab Escape',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiXYPlot',
        'metadata': { 'description': 'These data tracks were constructed from the human sera escape data for the Spike protein RBD Mutant library (PMID: 32841599). The mutant library was constructed such that each site in the RBD was mutated with 19 different substitutions in the genetic background of Wuhan-Hu-1. The resulting library covers 3804 of the 3819 possible amino acid mutations in the RBD (PMID: 33592168, 33495308). The height of the overlaid bar graph at each position represents the maximum (blue) and median (orange) escape fraction of all possible mutations at that position of the RBD when testing serum antibodies elicited from the Moderna vaccine.  The escape fraction refers to the proportion of yeast cells expressing the RBD mutation that escape the Moderna vaccine elicted antibodies in vitro (PMID: 33532768, 33592168, 33495308).' }
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Alpha_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'AlphaAAVariations',
        'key': 'Alpha',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Alpha'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Beta_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'BetaAAVariations',
        'key': 'Beta',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Beta'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Delta_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'DeltaAAVariations',
        'key': 'Delta',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Delta'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Epsilon_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'EpsilonAAVariations',
        'key': 'Epsilon',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Epsilon'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Eta_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'EtaAAVariations',
        'key': 'Eta',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Eta'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Gamma_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'GammaAAVariations',
        'key': 'Gamma',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Gamma'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Iota_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'IotaAAVariations',
        'key': 'Iota',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Iota'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Kappa_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'KappaAAVariations',
        'key': 'Kappa',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Kappa'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Mu_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'MuAAVariations',
        'key': 'Mu',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Mu'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/None_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NoneAAVariations',
        'key': 'No Class (B.1.617.3)',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation with no assigned class'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.1+BA.1.*_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.1AAVariations',
        'key': 'Omicron - BA.1',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.1'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.2+BA.2*_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.2AAVariations',
        'key': 'Omicron - BA.2',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.2'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.2.12.1_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.2.12.1AAVariations',
        'key': 'Omicron - BA.2.12.1',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.2.12.1'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.3_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.3AAVariations',
        'key': 'Omicron - BA.3',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.3'
        },
        'displayMode': 'normal'
      },{
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.4_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.4AAVariations',
        'key': 'Omicron - BA.4',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.4'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.5_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.5AAVariations',
        'key': 'Omicron - BA.5',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.5'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.2.75_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.2.75AAVariations',
        'key': 'Omicron - BA.2.75',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.2.75'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BA.4.6_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBA.4.6AAVariations',
        'key': 'Omicron - BA.4.6',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BA.4.6'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BQ.1_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBQ.1AAVariations',
        'key': 'Omicron - BQ.1',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BQ.1'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BQ.1.1_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBQ.1.1AAVariations',
        'key': 'Omicron - BQ.1.1',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BQ.1.1'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_XBB_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronXBBAAVariations',
        'key': 'Omicron - XBB',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron XBB'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_XBB.1_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronXBB.1AAVariations',
        'key': 'Omicron - XBB.1',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron XBB.1'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_XBB.1.5_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronXBB.1.5AAVariations',
        'key': 'Omicron - XBB.1.5',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron XBB.1.5'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Omicron_BF.7_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'OmicronBF.7AAVariations',
        'key': 'Omicron - BF.7',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Omicron BF.7'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Variants by WHO Name',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Zeta_variants.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'ZetaAAVariations',
        'key': 'Zeta',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Consensus variant constellation for Zeta'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Epitopes',
        'urlTemplate': distRoot + 'content/jbrowse/SARS_bcell_epitopes_human_02FEB2021_all_v3.sorted.gff.gz',
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'key': 'Antibody Epitopes',
        'label': 'HumanBCellEpitopes',
        'maxExportFeatures': 10000,
        'maxExportSpan': 10000000,
        'metadata': {
          'Description': 'Human BCell Epitopes'
        },
        'style': {
          'className': 'feature3',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3,
          'color': 'red'

        },
        'subfeatures': true,
        'glyph': 'JBrowse/View/FeatureGlyph/Segments',
        'subParts': 'epitope',
        'topLevelFeatures': 'epitope_region',
        'displayMode': 'collapsed'
      },
      {
        'category': 'Primers and Probes',
        'urlTemplate': distRoot + 'content/jbrowse/SARS-CoV-2_Primers_Probes.sorted.gff.gz',
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'key': 'Primers and Probes',
        'label': 'PrimersandProbes',
        'maxExportFeatures': 10000,
        'maxExportSpan': 10000000,
        'metadata': {
          'Description': 'Primers and Probes'
        },
        'style': {
          'className': 'feature3',
          'color': 'voColor(feature.data.parent)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3,
          'connectorColor': 'linen',
          'label': 'Variation'
        },
        'subfeatures': true,
        'glyph': 'JBrowse/View/FeatureGlyph/Segments',
        'subParts': 'CRISPR-Cas12,Multiplex_PCR,RT-dPCR,Singleplex_RT-PCR,MSSPE',
        'displayMode': 'normal'
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'blue',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Region_of_Interest.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Regionofinterest',
        'key': 'Region of Interest',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Region of Interest'
        },
        'subfeatures': true,
        'glyph': 'JBrowse/View/FeatureGlyph/Segments',
        'subParts': 'Region',
        'displayMode': 'compact'
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Topological_Domain.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Topologicaldomain',
        'key': 'Topological Domain',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Topological domain'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Metal_Ion_Binding_Site.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Metalionbindingsite',
        'key': 'Metal Ion Binding Site',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Metal ion binding site'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Transmembrane_Region.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Transmembraneregion',
        'key': 'Transmembrane Region',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Transmembrane region'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Chain.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Chains',
        'key': 'Chains',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Chains'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Mutagenesis_Site.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'MutagenesisSite',
        'key': 'Mutagenesis Site',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Mutagenesis Site'
        },
        'displayMode': 'collapsed'
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Active_Site.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Activesite',
        'key': 'Active Site',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Active site'
        },
        'displayMode': 'compact'
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Modified_Residue.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Modifiedresidue',
        'key': 'Modified Residue',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Modified residue'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Repeat_Region.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'RepeatRegion',
        'key': 'Repeat Region',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Repeat Region'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Nucleotide_Phosphate_Binding.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Nucleotidephosphatebinding',
        'key': 'Nucleotide Phosphate Binding',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Nucleotide phosphate binding'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Disulfide_Bond.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Disulfidebond',
        'key': 'Disulfide Bond',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Disulfide bond'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Short_Motif.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Shortmotif',
        'key': 'Short Motif',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Short motif'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Signal_Peptide.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Signalpeptide',
        'key': 'Signal Peptide',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Signal peptide'
        }
      },
      {
        'category': 'Structural Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Beta_Strand.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Betastrand',
        'key': 'Beta Strand',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Beta strand'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Zinc_Finger.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Zincfinger',
        'key': 'Zinc Finger',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Zinc finger'
        }
      },
      {
        'category': 'Structural Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Coiled_Coil.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Coiledcoil',
        'key': 'Coiled Coil',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Coiled coil'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Domains.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Domains',
        'key': 'Domains',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Domains'
        },
        'displayMode': 'compact'
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Glycosylation_Site.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'Glycosylationsite',
        'key': 'Glycosylation Site',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Glycosylation site'
        }
      },
      {
        'category': 'Structural Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Helix.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'HelixSecondaryStructure',
        'key': 'Helix',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Helix Secondary Structure'
        }
      },
      {
        'category': 'Functional Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Cleavage_Site.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'CleavageSites',
        'key': 'Cleavage Sites',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Cleavage Sites'
        }
      },
      {
        'category': 'Structural Features',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uniprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Turn.sorted.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'TurnSecondaryStructure',
        'key': 'Turn',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Turn Secondary Structure'
        }
      },
      {       
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-02-29.bw', 'name': 'Feb 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-03-31.bw', 'name': 'Mar 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-04-30.bw', 'name': 'Apr 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-05-31.bw', 'name': 'May 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2020/02 - 2020/05',
        'label': 'Positive Selection FEL Pvalue 2020/02 - 2020/05',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Feb 2020 - May 2020, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-06-30.bw', 'name': 'Jun 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-07-31.bw', 'name': 'Jul 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-08-31.bw', 'name': 'Aug 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-09-30.bw', 'name': 'Sep 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2020/06 - 2020/09',
        'label': 'Positive Selection FEL Pvalue 2020/06 - 2020/09',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Jun 2020 - Sep 2020, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-10-31.bw', 'name': 'Oct 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-11-30.bw', 'name': 'Nov 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2020-12-31.bw', 'name': 'Dec 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-01-31.bw', 'name': 'Jan 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2020/10 - 2021/01',
        'label': 'Positive Selection FEL Pvalue 2020/10 - 2021/01',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Oct 2020 - Jan 2021, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-02-28.bw', 'name': 'Feb 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-03-31.bw', 'name': 'Mar 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-04-30.bw', 'name': 'Apr 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-05-31.bw', 'name': 'May 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2021/02 - 2021/05',
        'label': 'Positive Selection FEL Pvalue 2021/02 - 2021/05',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Feb 2021 - May 2021 , according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-06-30.bw', 'name': 'Jun 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-07-31.bw', 'name': 'Jul 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-08-31.bw', 'name': 'Aug 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-09-30.bw', 'name': 'Sep 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2021/06 - 2021/09',
        'label': 'Positive Selection FEL Pvalue 2021/06 - 2021/09',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Jun 2021 - Sep 2021, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-10-31.bw', 'name': 'Oct 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-11-30.bw', 'name': 'Nov 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2021-12-31.bw', 'name': 'Dec 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' },
          { 'url': distRoot + 'content/jbrowse/positive_selection_2022-01-31.bw', 'name': 'Jan 2022', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#F5793A' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Postive Selection FEL Pvalue 2021/10 - 2022/01',
        'label': 'Positive Selection FEL Pvalue 2021/10 - 2022/01',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under positive selection from Oct 2021 - Jan 2022, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting positive selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger positive selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-02-29.bw', 'name': 'Feb 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-03-31.bw', 'name': 'Mar 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-04-30.bw', 'name': 'Apr 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-05-31.bw', 'name': 'May 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2020/02 - 2020/05',
        'label': 'Negative Selection FEL Pvalue 2020/02 - 2020/05',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Feb 2020 - May 2020, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being less than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-06-30.bw', 'name': 'Jun 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-07-31.bw', 'name': 'Jul 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-08-31.bw', 'name': 'Aug 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-09-30.bw', 'name': 'Sep 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2020/06 - 2020/09',
        'label': 'Negative Selection FEL Pvalue 2020/06 - 2020/09',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Jun 2020 - Sep 2020, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being less than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-10-31.bw', 'name': 'Oct 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-11-30.bw', 'name': 'Nov 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2020-12-31.bw', 'name': 'Dec 2020', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-01-31.bw', 'name': 'Jan 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2020/10 - 2021/01',
        'label': 'Negative Selection FEL Pvalue 2020/10 - 2021/01',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Oct 2020 - Jan 2021, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being less than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-02-28.bw', 'name': 'Feb 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-03-31.bw', 'name': 'Mar 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-04-30.bw', 'name': 'Apr 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-05-31.bw', 'name': 'May 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2021/02 - 2021/05',
        'label': 'Negative Selection FEL Pvalue 2021/02 - 2021/05',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Feb 2021 - May 2021 , according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-06-30.bw', 'name': 'Jun 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-07-31.bw', 'name': 'Jul 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-08-31.bw', 'name': 'Aug 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-09-30.bw', 'name': 'Sep 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2021/06 - 2021/09',
        'label': 'Negative Selection FEL Pvalue 2021/06 - 2021/09',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Jun 2021 - Sep 2021, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Natural Selection Heatmaps (Pond Lab)',
        'urlTemplates': [
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-10-31.bw', 'name': 'Oct 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-11-30.bw', 'name': 'Nov 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2021-12-31.bw', 'name': 'Dec 2021', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' },
          { 'url': distRoot + 'content/jbrowse/negative_selection_2022-01-31.bw', 'name': 'Jan 2022', 'description': '-Log10 FEL Likelihood Ratio Test Pvalue', 'nonCont': true, 'fill': true, 'color': '#A95AA1' }],
        'storeClass': 'jbrowse.repo/plugins/MultiBigWig/js/Store/SeqFeature/MultiBigWig',
        'autoscale': 'global',
        'style': { 'height': '100' },
        'colorizeAbout': 'true',
        'showLabels': true,
        'showTooltips': true,
        'labelWidth': '60',
        'key': 'Negative Selection FEL Pvalue 2021/10 - 2022/01',
        'label': 'Negative Selection FEL Pvalue 2021/10 - 2022/01',
        'type': 'jbrowse.repo/plugins/MultiBigWig/js/View/Track/MultiWiggle/MultiDensity',
        'metadata': { 'description': 'This track provides quantitative insight on the SARS-CoV-2 genomic sites that have been under negative selection from Oct 2021 - Jan 2022, according to the Pond lab (https://github.com/spond/SARS-CoV-2-variation).  If a site was exhibiting negative selection based on its dN/dS ratio being greater than 1 for each month, a box in the heatmap is shaded based on the -log10 of p-value of the FEL likelihood ratio test.  A darker color indicates a more significant p-value, and therefore a site under stronger negative selection, whereas no color indicates no significant selection.  Only sites with a FEL p-value of 0.05 or less are shaded.' }
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-02-29.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers02/2020',
        'key': '2020-02',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 02/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-03-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers03/2020',
        'key': '2020-03',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 03/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-04-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers04/2020',
        'key': '2020-04',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 04/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-05-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers05/2020',
        'key': '2020-05',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 05/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-06-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers06/2020',
        'key': '2020-06',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 06/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-07-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers07/2020',
        'key': '2020-07',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 07/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-08-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers08/2020',
        'key': '2020-08',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 08/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-09-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers09/2020',
        'key': '2020-09',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 09/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-10-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers10/2020',
        'key': '2020-10',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 10/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-11-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers11/2020',
        'key': '2020-11',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 11/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2020-12-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers12/2020',
        'key': '2020-12',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 12/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-01-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers01/2021',
        'key': '2021-01',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 01/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-02-28.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers02/2021',
        'key': '2021-02',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 02/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-03-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers03/2021',
        'key': '2021-03',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 03/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-04-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers04/2021',
        'key': '2021-04',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 04/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-05-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers05/2021',
        'key': '2021-05',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 05/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-06-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers06/2021',
        'key': '2021-06',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 06/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-07-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers07/2021',
        'key': '2021-07',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 07/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-08-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers08/2021',
        'key': '2021-08',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 08/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-09-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers09/2021',
        'key': '2021-09',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 09/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-10-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers10/2021',
        'key': '2021-10',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 10/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-11-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers11/2021',
        'key': '2021-11',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 11/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2021-12-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers12/2021',
        'key': '2021-12',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 12/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Positive Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/positive_selection_2022-01-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'PositiveSelectionMarkers01/2022',
        'key': '2022-01',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Positive Selection Sites 01/2022'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-02-29.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers02/2020',
        'key': '2020-02',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 02/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-03-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers03/2020',
        'key': '2020-03',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 03/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-04-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers04/2020',
        'key': '2020-04',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 04/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-05-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers05/2020',
        'key': '2020-05',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 05/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-06-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers06/2020',
        'key': '2020-06',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 06/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-07-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers07/2020',
        'key': '2020-07',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 07/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-08-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers08/2020',
        'key': '2020-08',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 08/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-09-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers09/2020',
        'key': '2020-09',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 09/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-10-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers10/2020',
        'key': '2020-10',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 10/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-11-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers11/2020',
        'key': '2020-11',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 11/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2020-12-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers12/2020',
        'key': '2020-12',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 12/2020'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-01-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers01/2021',
        'key': '2021-01',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 01/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-02-28.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers02/2021',
        'key': '2021-02',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 02/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-03-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers03/2021',
        'key': '2021-03',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 03/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/Negative_selection_2021-04-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers04/2021',
        'key': '2021-04',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 04/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-05-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers05/2021',
        'key': '2021-05',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 05/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-06-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers06/2021',
        'key': '2021-06',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 06/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-07-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers07/2021',
        'key': '2021-07',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 07/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-08-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers08/2021',
        'key': '2021-08',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 08/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-09-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers09/2021',
        'key': '2021-09',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 09/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-10-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers10/2021',
        'key': '2021-10',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 10/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-11-30.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers11/2021',
        'key': '2021-11',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 11/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2021-12-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers12/2021',
        'key': '2021-12',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 12/2021'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Negative Selection Sites (Pond Lab)',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/negative_selection_2022-01-31.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'NegativeSelectionMarkers01/2022',
        'key': '2022-01',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Negative Selection Sites 01/2022'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Drug Resistant Mutations',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/3C_resist.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'DrugResistant3CMutations',
        'key': '3C Resistant Mutations',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Drug resistant 3C-like proteinase mutations.  These mutations on 3C-like proteinase have been experimentally shown to confer drug resistance against Paxlovid/Nirmatrelvir.'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Drug Resistant Mutations',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/resist.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'DrugResistantRdRpMutations',
        'key': 'RdRp Resistant Mutations',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Drug resistant RdRp mutations.  These mutations on the RdRp have been experimentally shown to confer drug resistance against Remdesivir.'
        },
        'displayMode': 'normal'
      },
      {
        'category': 'Drug Resistant Mutations',
        'maxExportFeatures': 10000,
        'style': {
          'className': 'feature3',
          'color': 'uiprotColor(feature)',
          'showLabels': true,
          'showTooltips': true,
          'borderWidth': 3
        },
        'storeClass': 'JBrowse/Store/SeqFeature/GFF3Tabix',
        'urlTemplate': distRoot + 'content/jbrowse/s_resist.gff.gz',
        'maxExportSpan': 10000000,
        'label': 'DrugResistantSpikeMutations',
        'key': 'Spike Resistant Mutations',
        'type': 'JBrowse/View/Track/CanvasFeatures',
        'metadata': {
          'Description': 'Drug resistant Spike mutations.  These mutations on the Spike have been experimentally shown to confer drug resistance against Sotorvimab.'
        },
        'displayMode': 'normal'
      }
    ]
  })
}

router.use(httpParams)
router.use(authMiddleware)
router.use(PublicDataTypes)

router.get('/genome/2697049.107626/trackList', [
  function (req, res, next) {
    res.write(generateSarsCov2TrackList(req, res, next))
    res.end()
  }
])

router.get('/genome/:id/trackList', [
  function (req, res, next) {
    res.write(generateTrackList(req, res, next))
    res.end()
  }
])

router.get('/genome/:id/tracks', [
  function (req, res, next) {
    res.write('[]')
    res.end()
  }
])

router.get('/genome/:id/stats/global', [
  function (req, res, next) {
    req.call_collection = 'genome'
    req.call_method = 'query'
    req.queryType = 'rql'
    req.call_params = ['eq(genome_id,' + req.params.id + ')']
    debug('CALL_PARAMS: ', req.call_params)
    next()
  },
  RQLQueryParser,
  DecorateQuery,
  Limiter,
  APIMethodHandler,
  reqCounter,
  function (req, res, next) {
    if (res.results && res.results.response && res.results.response.docs) {
      // debug("solr result: ", res.results.response.docs);
      var featureCount = res.results.response.docs[0].patric_cds
      var genomeLength = res.results.response.docs[0].genome_length
      var featureDensity = (featureCount) / genomeLength
      // debug("patric_cds: ", featureCount);
      // debug("genome_length: ", genomeLength);
      res.json({ 'featureDensity': featureDensity, 'featureCount': featureCount })
      res.end()
    }
  }
])

router.get('/genome/:id/stats/region/:sequence_id', [
  function (req, res, next) {
    var start = req.query.start || req.params.start
    var end = req.query.end || req.params.end
    var annotation = req.query.annotation || req.params.annotation || 'PATRIC'
    req.call_collection = 'genome_feature'
    req.call_method = 'query'
    req.call_params = [[
      [// the query part has to come first.
        'accession:' + req.params.sequence_id,
        'annotation:' + annotation,
        '!(feature_type:source)',
        '(start:[' + start + '+TO+' + end + ']+OR+end:[' + start + '+TO+' + end + '])'
      ].join('+AND+'),
      'stats=true',
      'stats.field=na_length',
      'rows=0'
    ].join('&')]
    req.queryType = 'solr'
    next()
  },
  DecorateQuery,
  Limiter,
  APIMethodHandler,
  reqCounter,
  function (req, res, next) {
    if (res.results && res.results.stats) {
      var featureTotal = res.results.stats.stats_fields.na_length.sum
      var start = req.query.start || req.params.start
      var end = req.query.end || req.params.end
      var length = (end - start) + 1
      var featureDensity = featureTotal / length
      var featureCount = res.results.stats.stats_fields.na_length.count
      res.json({ 'featureDensity': featureDensity, 'featureCount': featureCount })
      res.end()
    }
  }
])

// only called when HTMLFeature track
router.get('/genome/:id/stats/regionFeatureDensities/:sequence_id', [
  function (req, res, next) {
    var start = req.query.start || req.params.start
    var end = req.query.end || req.params.end
    var annotation = req.query.annotation || req.params.annotation || 'PATRIC'
    var basesPerBin = req.query.basesPerBin || req.params.basesPerBin
    req.call_collection = 'genome_feature'
    req.call_method = 'query'
    req.call_params = [[
      'accession:' + req.params.sequence_id, // for subsequent processing in the Decorator the query part of this query has to come first
      'facet.range=start',
      'f.start.facet.range.end=' + end,
      'f.start.facet.range.start=' + start,
      'fq=annotation:' + annotation + '+AND+!(feature_type:source)',
      'facet.mincount=1',
      'rows=0',
      'f.start.facet.range.gap=' + basesPerBin,
      'facet=true'
    ].join('&')]
    req.queryType = 'solr'
    next()
  },
  DecorateQuery,
  Limiter,
  APIMethodHandler,
  reqCounter,
  function (req, res, next) {
    if (res.results && res.results.response && res.results.facet_counts.facet_ranges.start) {
      var binCounts = res.results.facet_counts.facet_ranges.start.counts.map(function (d) {
        if (typeof (d) === 'number') {
          return d
        }
      })
      var maxCount = Math.max(binCounts)

      res.json({
        'stats': {
          'basesPerBin': req.query.basesPerBin,
          'max': maxCount
        },
        'bins': binCounts
      })
      res.end()
    }
  }
])

router.get('/genome/:id/features/:seq_accession', [
  function (req, res, next) {
    // debug("req.params: ", req.params, "req.query: ", req.query);

    var start = req.query.start || req.params.start
    var end = req.query.end || req.params.end
    var annotation = req.query.annotation || req.params.annotation || 'PATRIC'
    req.call_collection = 'genome_feature'
    req.call_method = 'query'

    var st = 'between(start,' + start + ',' + end + ')'
    var en = 'between(end,' + start + ',' + end + ')'

    var over = 'and(lt(start,' + start + '),gt(end,' + end + '))'
    if (req.query && req.query['reference_sequences_only']) {
      req.call_collection = 'genome_sequence'

      req.call_params = ['and(eq(genome_id,' + req.params.id + '),eq(accession,' + req.params.seq_accession + '))']
      req.call_params[0] += '&limit(10000)'
    } else {
      req.call_params = ['and(eq(genome_id,' + req.params.id + '),eq(accession,' + req.params.seq_accession + '),eq(annotation,' + annotation + '),or(' + st + ',' + en + ',' + over + '),ne(feature_type,source))']
      req.call_params[0] += '&select(patric_id,refseq_locus_tag,gene,product,annotation,feature_type,protein_id,gene_id,genome_name,accession,strand,na_length,aa_length,genome_id,start,end,feature_id,segments,classifier_score,classifier_round)'
      req.call_params[0] += '&limit(10000)&sort(+start)'
    }
    req.queryType = 'rql'
    // debug("CALL_PARAMS: ", req.call_params);
    next()
  },
  RQLQueryParser,
  DecorateQuery,
  Limiter,
  APIMethodHandler,
  reqCounter,
  function (req, res, next) {
    if (req.call_collection === 'genome_sequence') {
      if (res.results && res.results.response && res.results.response.docs) {
        var refseqs = res.results.response.docs.map(function (d) {
          var end = req.query.end || req.params.end
          var start = req.query.start || req.params.start
          start = start < 0 ? 0 : start
          end = end > d.length ? d.length : end
          var sequence = d.sequence.slice(start, end + 1)
          var length = end - start
          return {
            length: length,
            name: d.accession,
            accn: d.accession,
            type: 'reference',
            score: d.gc_content,
            sid: d.genome_id,
            start: start,
            end: end,
            seq: sequence,
            seqChunkSize: length
          }
        })
        res.json({ features: refseqs })
        res.end()
      }
    } else {
      next()
    }
  },
  function (req, res, next) {
    // debug("res.results: ", res.results)
    if (res.results && res.results.response && res.results.response.docs) {
      var features = res.results.response.docs.map(function (d) {
        d.type = d.feature_type
        d.name = d.accession
        d.uniqueID = d.feature_id
        d.strand = (d.strand === '+') ? 1 : -1
        d.start = d.start - 1
        // format subfeatures for segmented feature
        if (d.segments.length > 1) {
          d.subfeatures = d.segments.map((segment, idx) => {
            const [start, end] = segment.split('..').map(val => parseInt(val))
            return {
              uniqueID: `${d.feature_id}_seg${idx}`,
              start: start - 1,
              end: end,
              strand: d.strand,
              protein_id: `${d.protein_id}_seg${idx}`,
              feature_type: 'CDS',
              type: 'CDS'
            }
          })
          // temporary switch
          // const pos = d.segments.map(seg => seg.split('..').map(pos => parseInt(pos))).reduce((r, el) => r.concat(el), [])
          // d.end = Math.max(...pos)
          // d.start = Math.min(...pos) - 1

          d.type = 'segmented'
        } else {
          delete d.segments
        }
        // temporary hack for aa and na sequence for tracks
        d.aa_sequence = ' '
        d.na_sequence = ' '
        return d
      })
      // debug("FEATURES: ", features)
      res.json({ features: features })
      res.end()
    }
  }
])

router.get('/genome/:id/refseqs', [
  function (req, res, next) {
    req.call_collection = 'genome_sequence'
    req.call_method = 'query'
    req.call_params = ['&eq(genome_id,' + req.params.id + ')&select(accession,length,sequence_id)&sort(+accession)&limit(1000)']
    req.queryType = 'rql'
    next()
  },
  RQLQueryParser,
  DecorateQuery,
  Limiter,
  APIMethodHandler,
  reqCounter,
  function (req, res, next) {
    // debug("Res.results: ", res.results);
    if (res.results && res.results.response && res.results.response.docs) {
      var refseqs = res.results.response.docs.map(function (d) {
        return {
          length: d.length,
          name: d.accession,
          accn: d.accession,
          sid: d.genome_id,
          start: 0,
          end: d.length,
          seqDir: '',
          seqChunkSize: d.length
        }
      })
      res.json(refseqs)
      res.end()
    }
  }
])

router.get('/genome/:id/names/', [
  function (req, res, next) {
    res.json([])
    res.end()
  }
])
module.exports = router
