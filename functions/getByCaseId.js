// This function is the endpoint's request handler.
exports = function({ query, headers, body}, response) {
   
//exports = async function(args){
  // This default function will get a value and find a document in MongoDB
  // To see plenty more examples of what you can do with functions see: 
  // https://www.mongodb.com/docs/atlas/app-services/functions/
  const {caseId} = query;
  console.log('caseId = '+caseId);
    
  
  const pipeline = [
  {
    $match: {
      caseId: {
        $in: [caseId],
      },
    },
  },
  {
    $sort: {
      "hdr.creDtTm": -1,
    },
  },
  {
    $group: {
      _id: "$caseId",
      totalClaims: {
        $count: {},
      },
      claimList: {
        $push: {
          claimId: "$claimId",
          transAmount: {
            $ifNull: [
              "$orgnlTx.tx.trxAmts.trxAmt.amt",
              "$orgnlTx.txAmts.txAmt.amt",
            ],
          },
          transAmountCurrency: {
            $ifNull: [
              "$orgnlTx.tx.trxAmts.trxAmt.ccy",
              "$orgnlTx.txAmts.txAmt.ccy",
            ],
          },
          disputedAmount:'$dsptData.dsptAmts.amt',
          disputedAmountCurrency:'$dsptData.dsptAmts.ccy',
          merchant:"$orgnlTx.accptr.nmAndLctn",
          lastUpdatedDate:'$hdr.lastModifiedDtTm',
          claimType:'DI',
          claimStatus: "$dsptData.dsptStsTxt",
          latestEvent: "$dsptData.dsptltstEvnt",
          claimStatusCode:'$dsptData.dsptSts'
        },
      },
     
      caseId: {
        $first: "$caseId",
      },
      cardNo: {
        $first: "$card.mskdPAN",
      },
      createdDate: {
        $first: "$hdr.creDtTm",
      },
      lastModifiedDate: {
        $last: "$hdr.lastModifiedDtTm",
      },
      caseStatus: {
        // $first: "$caseStsTxt",
        $first: {
          $cond: {
            if: {
              $eq: ["$caseStsTxt", "Closed"],
            },
            then: "Closed",
            else: "New",
          },
        },
      },
      cardHolderName: {
        $first: {
          $concat: [
            "$crdhldr.crdhldrNm.gvnNm",
            " ",
            "$crdhldr.crdhldrNm.lastNm",
          ],
        },
      },
      cardHolderEmail: {
        $first: "$crdhldr.ctctInf.prsnlEmailAdr",
      },
      cardStatus: {
        $first: "$card.cardStatus",
      },
      cardType: {
        $first: "$card.cardBrnd",
      },
      disputeReason: {
        $first: "$dsptData.dsptCtgryDesc",
      },
      maskCardNo:{
         $first: "$card.mskdPAN",
      }
    },
  },
  {
    $project: {
      _id: 0,
    },
  },
];


  // Find the name of the MongoDB service you want to use (see "Linked Data Sources" tab)
  var serviceName = "mongodb-atlas";

  // Update these to reflect your db/collection
  var dbName = "case_management";
  var collName = "cases";

  // Get a collection from the context
  var collection = context.services.get(serviceName).db(dbName).collection(collName);

  return collection.aggregate(pipeline).toArray()
  .then(cases => {
    console.log(`Successfully fetched ${cases.length} cases.`)
    for(const c1 of cases) {
      console.log(`caseId: ${c1.caseId}`)
      
    }
    return cases
  })
  .catch(err => console.error(`Failed to get cases: ${err}`))



};